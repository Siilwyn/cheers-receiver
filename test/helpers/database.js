const leveldb = require('level');
const memdown = require('memdown');
const { promisify } = require('util');

module.exports = {
  create,
  clear,
};

function create () {
  const testDb = leveldb({ db: memdown });
  testDb.get = promisify(testDb.get);
  testDb.put = promisify(testDb.put);

  return testDb;
}

function clear() {
  memdown.clearGlobalStore();
}
