const leveldb = require('level');
const { promisify } = require('util');

const server = require('./server.js');

const cheersDb = leveldb(process.env.CHEERS_RECEIVER_DB || require('memdown'));
cheersDb.get = promisify(cheersDb.get);
cheersDb.put = promisify(cheersDb.put);

server.start({
  port: process.env.PORT || 3000,
  database: cheersDb,
});
