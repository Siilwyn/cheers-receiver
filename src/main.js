const leveldb = require('level');
const microRatelimit = require('micro-ratelimit');
const { promisify } = require('util');

const ratelimit = microRatelimit({ window: 30000 }, () => Promise.resolve());

const server = require('./server.js');

const cheersDb = leveldb(process.env.CHEERS_RECEIVER_DB || require('memdown'));
cheersDb.get = promisify(cheersDb.get);
cheersDb.put = promisify(cheersDb.put);

server.start({
  port: process.env.PORT || 3000,
  instance: server.instance({
    database: cheersDb,
    ratelimit,
  }),
});
