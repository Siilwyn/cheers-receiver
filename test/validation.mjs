import got from 'got';
import test from 'ava';

import { createRequest } from './helpers/request.mjs';
import { createDatabase } from './helpers/database.mjs';
import { server } from '../src/server.mjs';

test.beforeEach('create database', (t) => {
  t.context.testDb = createDatabase();
});

test.beforeEach('set required context', (t) => {
  t.context.testKey = 'some-key';
});

test.afterEach.always('stop server', (t) => {
  t.context.testServer.close();
});

test('Should pass when key is resolved by validation', (t) => {
  const validKey = () => Promise.resolve();

  t.context.testServer = server
    .ignite({
      database: t.context.testDb,
      verifyKey: validKey,
    })
    .launch({ port: 0 });

  return got
    .post(...createRequest(t, { port: t.context.testServer.address().port }))
    .then(() => t.pass());
});

test('Should return error when key is rejected by validation', (t) => {
  const invalidKey = () => {
    const error = new Error('Invalid key');
    error.statusCode = 403;
    return Promise.reject(error);
  };

  t.context.testServer = server
    .ignite({
      database: t.context.testDb,
      verifyKey: invalidKey,
    })
    .launch({ port: 0 });

  return Promise.all([
    got
      .post(...createRequest(t, { port: t.context.testServer.address().port }))
      .then(t.fail),
    got
      .get(...createRequest(t, { port: t.context.testServer.address().port }))
      .then(t.fail),
  ]).catch((error) => {
    t.truthy(error);
    t.is(error.message, 'Response code 403 (Forbidden)');
  });
});
