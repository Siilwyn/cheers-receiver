const leveldb = require('level');
const { promisify } = require('util');

const server = require('./server.js');

const database = leveldb(process.env.LEVELDOWN_DB || require('memdown'));
database.get = promisify(database.get);
database.put = promisify(database.put);

server.start({
  port: process.env.PORT || 3000,
  instance: server.instance({
    database,
  }),
});
