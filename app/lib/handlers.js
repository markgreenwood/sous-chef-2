const R = require('ramda');
const moment = require('moment');
const diff = require('deep-diff');

const isNilOrEmpty = R.either(R.isNil, R.isEmpty);
const getTimestamps = R.pluck('statsTimestamp');

const bulkify = R.compose(
  R.flatten,
  R.map(item => [{ index: { _index: 'monitored-index-stats', _type: 'stats' } }, item])
);

const getIndexStats = index => (result) => {
  const indexResult = result.indices[index];

  if (isNilOrEmpty(indexResult)) {
    return R.merge({ index }, { message: `No stats found for ${index}` });
  }

  return R.merge({ index }, indexResult);
};

const getIndexData = (index, data) => R.filter(item => R.equals(item.index, index), data);

const makeIndexReport = (index, data) => { // eslint-disable-line no-unused-vars
  const idxData = getIndexData(index, data);

  const [begin, end] =
    R.juxt([R.head, R.last])(R.sort((a, b) => a - b, R.map(moment, getTimestamps(idxData))));

  const baseline = R.head(R.filter(
    R.both(
      R.compose(R.equals(begin), R.compose(moment, R.prop('statsTimestamp'))),
      R.compose(R.equals(index), R.prop('index'))
    ),
    data
  ));

  const target = R.head(R.filter(
    R.both(
      R.compose(R.equals(end), R.compose(moment, R.prop('statsTimestamp'))),
      R.compose(R.equals(index), R.prop('index'))
    ),
    data
  ));

  return { index, begin: begin.format(), end: end.format(), diff: R.defaultTo(null, R.apply(diff, R.map(R.omit(['statsTimestamp']), [baseline, target]))) };
};

const getDiffs = ({ statsClient }) => async () => {
  const allStats = await statsClient.search({ index: 'monitored-index-stats', type: 'stats', size: 999 })
    .then(R.pathOr([], ['hits', 'hits']))
    .then(R.pluck('_source'));

  const indices = R.compose(R.uniq, R.pluck('index'))(allStats);

  const report = R.map(idx => makeIndexReport(idx, allStats), indices);

  // return R.map(R.omit(['diff']), R.filter(R.compose(R.isNil, R.prop('diff')), report));\
  return report;
};

const recordSnapshot = ({ monitoredClient, statsClient }) => async () => {
  const indices = await monitoredClient.cat.indices({ format: 'json' })
    .then(R.pluck('index'))
    .then(R.without('.kibana'));

  console.log(`Found ${indices.length} indices: `, indices);

  return Promise.all(R.map(
    index => monitoredClient.indices.stats({ index, metric: 'indexing,get,search' })
      .then(getIndexStats(index))
      .then(R.merge({ statsTimestamp: moment().format() }))
      .catch(console.log),
    indices
  ))
    .then(bulkify)
    .then((resp) => {
      console.log(`Preparing to bulk index ${resp.length / 2} records`);
      return resp;
    })
    .then(resp => statsClient.bulk({ body: resp }))
    .catch(console.log);
};

module.exports = {
  recordSnapshot,
  getDiffs
};
