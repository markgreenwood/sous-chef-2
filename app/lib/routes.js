const pkg = require('../package.json');
const { recordSnapshot, getDiffs } = require('./handlers');
const es = require('elasticsearch');
const config = require('config');

const statsClient = es.Client({ host: config.get('stats-es-cluster').host });
const monitoredClient = es.Client({ host: config.get('monitored-es-cluster').host });

const standardApi = {
  name: 'standardApi',
  version: '1.0.0',
  register: async (aServer, options) => { // eslint-disable-line no-unused-vars
    aServer.route({
      method: 'GET',
      path: '/healthcheck',
      handler: (request, h) => // eslint-disable-line no-unused-vars
        ({
          status: 'ok',
          service: pkg.name,
          version: pkg.version
        })
    });
    aServer.route({
      method: 'GET',
      path: '/{path*}',
      handler: (request, h) => {
        if (request.params.path && request.params.path.endsWith('main.js')) {
          return h.file('public/main.js');
        }

        return h.file('public/index.html');
      }
    });
  }
};

const monitorApi = {
  name: 'monitorApi',
  version: '1.0.0',
  register: async (aServer, options) => { // eslint-disable-line no-unused-vars
    aServer.route({
      method: 'GET',
      path: '/record',
      handler: (request, h) => // eslint-disable-line no-unused-vars
        recordSnapshot({ monitoredClient, statsClient })(),
      config: { tags: ['api'] }
    });

    aServer.route({
      method: 'GET',
      path: '/analysis/diffs',
      handler: (request, h) => // eslint-disable-line no-unused-vars
        getDiffs({ statsClient })(),
      config: { tags: ['api'] }
    });
  }
};

module.exports = {
  standardApi,
  monitorApi
};
