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

test('Should pass when rate limit resolves', t => {
  const testServer = server.instance({
    database: t.context.testDb,
    ratelimit: () => Promise.resolve(),
  });
  testServer.listen(0);
  t.context.testServer = testServer;

  return got
    .post(...request.create(t, { port: testServer.address().port }))
    .then(() => t.pass());
});

test('Should return error when rate limit rejects', t => {
  const ratelimitReject = () => {
    const error = new Error();
    error.statusCode = 429;
    throw error;
  };

  const testServer = server.instance({
    database: t.context.testDb,
    ratelimit: ratelimitReject,
  });
  testServer.listen(0);
  t.context.testServer = testServer;

  return got
    .post(...request.create(t, { port: testServer.address().port }))
    .then(t.fail)
    .catch(error => t.is(error.statusCode, 429));
});
