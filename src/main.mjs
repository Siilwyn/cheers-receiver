import got from 'got';
import leveldown from 'leveldown';
import levelup from 'levelup';

import { server } from './server.mjs';

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
      throw error;
    }
  });
}
