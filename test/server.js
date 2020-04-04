'use strict';

const test = require('ava');
const got = require('got');

const request = require('./helpers/request.js');
const database = require('./helpers/database.js');
const server = require('../src/server.js');

test.beforeEach('create database', (t) => {
  t.context.testDb = database.create();
  t.context.testDbGetNumber = (key) =>
    t.context.testDb
      .get(key, { asBuffer: false })
      .then((value) => String(value));
});

test.beforeEach('start server', (t) => {
  const testServer = server
    .ignite({
      database: t.context.testDb,
    })
    .launch({ port: 0 });

  t.context.testServer = testServer;
  t.context.port = testServer.address().port;
  t.context.testKey = 'your-own-secure-linux-box';
});

test.afterEach.always('stop server', (t) => {
  t.context.testServer.close();
});

test('POST should create initial count on new entry', (t) => {
  return got
    .post(...request.create(t, { followRedirect: false }))
    .then(async (response) => {
      t.is(response.body, '1', 'Should return count incremented by one');
      t.is(response.statusCode, 303);
      t.is(
        await t.context.testDbGetNumber(t.context.testKey),
        '1',
        'Should write new count to database',
      );
    });
});

test('POST should increment count on existing entry', (t) => {
  t.context.testDb.put(t.context.testKey, 6);

  return got
    .post(...request.create(t, { followRedirect: false }))
    .then(async (response) => {
      t.is(response.body, '7', 'Should return count incremented by one');
      t.is(response.statusCode, 303);
      t.is(
        await t.context.testDbGetNumber(t.context.testKey),
        '7',
        'Should write new count to database',
      );
    });
});

test('POST should redirect to referer if available', (t) => {
  const originUrl = 'http://sii.com/apage';

  return got
    .post(
      ...request.create(t, {
        headers: { referer: originUrl },
        followRedirect: false,
      }),
    )
    .then((response) => {
      t.is(response.headers.location, `${originUrl}#count-send`);
      t.is(response.statusCode, 303, 'Is redirected');
    });
});

test('POST should redirect to host', (t) => {
  return got
    .post(...request.create(t, { followRedirect: false }))
    .then((response) => {
      t.regex(response.headers.location, /http.+localhost:\d+\#count-send/);
      t.is(response.statusCode, 303, 'Is redirected');
    });
});

test('GET should return initial count on non-existing entry', (t) => {
  return got.get(...request.create(t)).then(async (response) => {
    t.is(response.body, '0', 'Should return count');
    t.is(response.statusCode, 200);

    t.context.testDb
      .get(t.context.testKey)
      .catch(() => t.pass('Should not create new key'));
  });
});

test('GET should return count on existing entry', (t) => {
  t.context.testDb.put(t.context.testKey, 3);

  return got.get(...request.create(t)).then(async (response) => {
    t.is(response.body, '3', 'Should return count');
    t.is(response.statusCode, 200);
    t.is(
      await t.context.testDbGetNumber(t.context.testKey),
      '3',
      'Should not change count at database',
    );
  });
});
