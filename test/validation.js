const got = require('got');
const test = require('ava');

const request = require('./helpers/request.js');
const database = require('./helpers/database.js');
const server = require('../src/server.js');

test.beforeEach('create database', t => {
  t.context.testDb = database.create();
});

test.afterEach.always('clear database', t => {
  database.clear();
});

test.afterEach.always('stop server', t => {
  t.context.testServer.close();
});

test('Should pass when key is resolved by validation', t => {
  const validKey = () => Promise.resolve();

  const testServer = server.instance({
    database: t.context.testDb,
    verifyKey: validKey,
  });
  testServer.listen(0);
  t.context.testServer = testServer;

  return got
    .post(...request.create(t, { port: testServer.address().port }))
    .then(() => t.pass());
});

test('Should return error when key is rejected by validation', t => {
  const invalidKey = () => {
    const error = new Error('Invalid key');
    error.statusCode = 403;
    return Promise.reject(error);
  };

  const testServer = server.instance({
    database: t.context.testDb,
    verifyKey: invalidKey,
  });
  testServer.listen(0);
  t.context.testServer = testServer;

  return got
    .post(...request.create(t, { port: testServer.address().port }))
    .then(t.fail)
    .catch(error => {
      t.truthy(error);
      t.is(error.message, 'Response code 403 (Forbidden)');
    });
});
