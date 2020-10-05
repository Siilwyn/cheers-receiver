'use strict';

const got = require('got');
const leveldown = require('leveldown');
const levelup = require('levelup');

const server = require('./server.js');

const database = levelup(leveldown(process.env.LEVELDOWN_DB));
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

  return database.get(key).catch((error) => {
    if (error.type == 'NotFoundError') {
      return got.head(`https://selwyn.cc/writings/${key}`);
    } else {
      error.message = `Could not reach the database.`;
      throw error;
    }
  });
}
