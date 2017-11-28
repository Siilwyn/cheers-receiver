module.exports = {
  create,
};

function create(t, options = {}) {
  return [
    Object.assign(
      {},
      {
        port: t.context.port,
        path: '/',
        host: 'localhost',
      },
      options,
    ),
    {
      query: { key: t.context.testKey },
    },
  ];
}
