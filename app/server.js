const config = require('config');
const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');

const { standardApi, monitorApi } = require('./lib/routes');

const pkg = require('./package');

const { host, port } = config.get('hapiServer');
const server = Hapi.server({ host, port });

async function registerPlugins(theServer) {
  const swaggerOptions = {
    info: {
      title: 'ES Index Monitor',
      version: pkg.version,
    },
  };

  try {
    await theServer.register(standardApi);
    await theServer.register(monitorApi);
    await theServer.register([
      Inert,
      Vision,
      {
        plugin: HapiSwagger,
        options: swaggerOptions
      }
    ]);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`Plugins registered on ${theServer.info.uri}`);
  return theServer;
}

async function startServer(theServer) {
  try {
    await theServer.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`Server running at ${theServer.info.uri}`);
  return theServer;
}

registerPlugins(server)
  .then(startServer);
