const got = require('got');
const leveldb = require('level');
const memdown = require('memdown');
const { promisify } = require('util');
const test = require('ava');

const server = require('./server.js');

test.beforeEach('start server and database', t => {
  const testDb = leveldb({ db: memdown });
  testDb.get = promisify(testDb.get);
  testDb.put = promisify(testDb.put);

  const testServer = server.instance(testDb);
  testServer.listen(0);

  t.context.testServer = testServer;
  t.context.port = testServer.address().port;
  t.context.testDb = testDb;
});

test.afterEach.always('stop server and clear database', t => {
  memdown.clearGlobalStore();
  t.context.testServer.close();
});

test('Should increment value on valid request', t => {
  const testKey = 'your-own-secure-linux-box';
  t.context.testDb.put(testKey, 0);

  return got(
    { port: t.context.port },
    {
      body: { key: testKey },
      form: true,
    },
  ).then(async response => {
    t.is(response.body, '1', 'Should return count incremented by one');
    t.is(
      await t.context.testDb.get(testKey),
      '1',
      'Should write new count to database',
    );
  });
});
