const got = require('got');
const nock = require('nock');
const test = require('ava');

const database = require('./helpers/database.js');
const server = require('../src/server.js');

test.beforeEach('create database', t => {
  t.context.testDb = database.create();
});

test.beforeEach('start server', t => {
  const testServer = server.instance({
    database: t.context.testDb,
  });
  testServer.listen(0);

  t.context.testServer = testServer;
  t.context.port = testServer.address().port;
  t.context.testKey = 'your-own-secure-linux-box';
});

test.afterEach.always('clear database', t => {
  database.clear();
});

test.afterEach.always('stop server', t => {
  t.context.testServer.close();
});

test('POST should create initial count on new entry', t => {
  return got
    .post(
      { port: t.context.port, followRedirect: false },
      {
        body: { key: t.context.testKey },
        form: true,
      },
    )
    .then(async response => {
      t.is(response.body, '1', 'Should return count incremented by one');
      t.is(response.statusCode, 303);
      t.is(
        await t.context.testDb.get(t.context.testKey),
        '1',
        'Should write new count to database',
      );
    });
});

test('POST should increment count on existing entry', t => {
  t.context.testDb.put(t.context.testKey, 6);

  return got
    .post(
      { port: t.context.port, followRedirect: false },
      {
        body: { key: t.context.testKey },
        form: true,
      },
    )
    .then(async response => {
      t.is(response.body, '7', 'Should return count incremented by one');
      t.is(response.statusCode, 303);
      t.is(
        await t.context.testDb.get(t.context.testKey),
        '7',
        'Should write new count to database',
      );
    });
});

test('POST should redirect to referer if available', t => {
  const originUrl = 'http://sii.com/apage';
  nock(originUrl)
    .get('')
    .query({ countSend: 1 })
    .reply(200);

  return got
    .post(
      { port: t.context.port },
      {
        headers: { referer: originUrl },
        body: { key: t.context.testKey },
        form: true,
      },
    )
    .then(response => {
      t.truthy(response.requestUrl, 'Is redirected');
      t.is(response.statusCode, 200);
      t.is(response.url, `${originUrl}?countSend=1`);
    });
});

test('POST should redirect to host', t => {
  nock('http://sii.com/apage')
    .get('')
    .query({ countSend: 1 })
    .reply(200);

  return got
    .post(
      { port: t.context.port, protocol: 'http:' },
      {
        body: { key: t.context.testKey },
        form: true,
      },
    )
    .then(response => {
      t.truthy(response.requestUrl, 'Is redirected');
      t.is(response.statusCode, 200);
      t.regex(response.url, /http.+localhost:\d+\/\?countSend=1/);
    });
});

test('GET should return initial count on non-existing entry', t => {
  return got
    .get(
      { port: t.context.port },
      {
        body: { key: t.context.testKey },
        form: true,
      },
    )
    .then(async response => {
      t.is(response.body, '0', 'Should return count');
      t.is(response.statusCode, 200);

      t.context.testDb
        .get(t.context.testKey)
        .catch(() => t.pass('Should not create new key'));
    });
});

test('GET should return count on existing entry', t => {
  t.context.testDb.put(t.context.testKey, 3);

  return got
    .get(
      { port: t.context.port },
      {
        body: { key: t.context.testKey },
        form: true,
      },
    )
    .then(async response => {
      t.is(response.body, '3', 'Should return count');
      t.is(response.statusCode, 200);
      t.is(
        await t.context.testDb.get(t.context.testKey),
        '3',
        'Should not change count at database',
      );
    });
});

test('Returns error on invalid request method', t => {
  return got
    .patch({ port: t.context.port })
    .then(() => t.fail())
    .catch(error => t.is(error.statusCode, 400));
});
