const got = require('got');
const leveldb = require('level');
const { promisify } = require('util');

const server = require('./server.js');

const database = leveldb(process.env.LEVELDOWN_DB || require('memdown'));
database.get = promisify(database.get);
database.put = promisify(database.put);
database.close = database.close.bind(database);

server
  .ignite({ database, verifyKey })
  .launch({ port: process.env.PORT || 3293 });

function verifyKey(key) {
  if (!key) {
    throw {
      message: 'Key not defined',
      statusCode: 400,
    };
  }

  return database.get(key).catch(error => {
    if (error.type == 'NotFoundError') {
      return got.head(`https://selwyn.cc/writings/${key}`);
    } else {
      throw error;
    }
  });
}
