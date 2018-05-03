const got = require('got');
const test = require('ava');

const request = require('./helpers/request.js');
const database = require('./helpers/database.js');
const server = require('../src/server.js');

test.beforeEach('create database', t => {
  t.context.testDb = database.create();
});

test.afterEach.always('stop server', t => {
  t.context.testServer.close();
});

test('Should pass when key is resolved by validation', t => {
  const validKey = () => Promise.resolve();

  t.context.testServer = server
    .ignite({
      database: t.context.testDb,
      verifyKey: validKey,
    })
    .launch({ port: 0 });

  return got
    .post(...request.create(t, { port: t.context.testServer.address().port }))
    .then(() => t.pass());
});

test('Should return error when key is rejected by validation', t => {
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
      .post(...request.create(t, { port: t.context.testServer.address().port }))
      .then(t.fail)
      .catch(error => {
        t.truthy(error);
        t.is(error.message, 'Response code 403 (Forbidden)');
      }),
    got
      .get(...request.create(t, { port: t.context.testServer.address().port }))
      .then(t.fail)
      .catch(error => {
        t.truthy(error);
        t.is(error.message, 'Response code 403 (Forbidden)');
      }),
  ]);
});
