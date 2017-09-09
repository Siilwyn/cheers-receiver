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
      },
      options,
    ),
    {
      query: {key: t.context.testKey},
    },
  ]
}
