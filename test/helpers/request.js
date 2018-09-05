module.exports = {
  create,
};

function create(t, options = {}) {
  return [
    {
      port: t.context.port,
      path: '/',
      host: 'localhost',
    },
    {
      query: { key: t.context.testKey },
      ...options,
    },
  ];
}
