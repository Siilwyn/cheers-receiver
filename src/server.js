const micro = require('micro');
const querystring = require('querystring');
const url = require('url');

module.exports = {
  instance,
  start,
};

function instance({
  database,
  verifyKey = () => true,
}) {
  return micro(async (request, response) => {
    const key = querystring.parse(url.parse(request.url).query).key;
    response.setHeader('Access-Control-Allow-Origin', '*');

    if (request.method === 'POST') {
      await verifyKey(key);

      return database
        .get(key)
        .catch(() => 0)
        .then(async count => {
          const newCount = Number(count) + 1;

          await database.put(key, newCount);

          response.setHeader('Content-Type', 'text/plain');
          response.setHeader('Location', getRedirectUrl(request.headers));

          micro.send(response, 303, newCount);
        })
        .catch(error => {
          response.end();
        });
    }
    if (request.method === 'GET') {
      return database.get(key).catch(error => Promise.resolve('0'));
    }

    throw micro.createError(400);
  });
}

function start({ instance, port }) {
  instance.listen(port);

  process.on('SIGINT', () => {
    instance.close(process.exit);
  });
}

function getRedirectUrl({ referer, host }) {
  let urlObject;

  if (referer) {
    urlObject = url.parse(referer);
  } else {
    urlObject = {
      protocol: 'http',
      host,
    };
  }

  return url.format({
    ...urlObject,
    search: '?countSend=1',
  });
}
