const levelup = require('levelup');
const memdown = require('memdown');

module.exports = {
  create: () => levelup(memdown()),
};
