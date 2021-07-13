export { createRequest };

function createRequest(t, options = {}) {
  return [
    {
      port: t.context.port,
      pathname: '/',
      host: 'localhost',
      protocol: 'http:',
    },
    {
      searchParams: { key: t.context.testKey },
      ...options,
    },
  ];
}
