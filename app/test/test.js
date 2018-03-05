const assert = require('assert');
const sinon = require('sinon'); // eslint-disable-line import/no-extraneous-dependencies

const { getDiffs, recordSnapshot } = require('../lib/handlers');

const sampleData = require('./sampleData.json');
const expectedResult = require('./expectedResult.json');

const statsClient = {
  search: sinon.stub().resolves(sampleData),
  bulk: sinon.stub()
};
const monitoredClient = {
  cat: { indices: sinon.stub().resolves([]) },
  indices: { stats: sinon.stub().resolves({}) }
};

const analyzer = getDiffs({ statsClient });
const recorder = recordSnapshot({ monitoredClient, statsClient });

describe('getDiffs', () => {
  it('returns the diffs between stats with earliest and latest timestamps', () =>
    analyzer()
      .then((resp) => {
        assert.deepEqual(resp, expectedResult);
      }));
});

describe('fetchStats', () => {
  it.skip('returns the available stats data', () => {
    assert(false);
  });
});

describe('recordSnapshot', () => {
  it('saves data from the monitored index into the stats index', () =>
    recorder()
      .then(() => {
        assert(statsClient.bulk.calledOnce);
      }));
});
