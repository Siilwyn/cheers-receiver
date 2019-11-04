'use strict';

module.exports = {
  create,
};

function create(t, options = {}) {
  return [
    {
      port: t.context.port,
      path: '/',
      host: 'localhost',
      protocol: 'http:',
    },
    {
      query: { key: t.context.testKey },
      ...options,
    },
  ];
}
