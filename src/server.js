const micro = require('micro');
const querystring = require('querystring');
const url = require('url');

module.exports = {
  ignite,
};

function createInstance({ database, verifyKey }) {
  return micro(async (request, response) => {
    const key = querystring.parse(url.parse(request.url).query).key;
    response.setHeader('Access-Control-Allow-Origin', '*');

    try {
      await verifyKey(key);
    } catch (error) {
      return micro.send(response, error.statusCode, error.message);
    }

    if (request.method === 'POST') {
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
    hash: 'count-send',
  });
}

function ignite({ database, verifyKey = () => true }) {
  const instance = createInstance({ database, verifyKey });

  return {
    launch: launchFactory({
      instance,
      closeHandler: database.close,
    }),
    instance: () => instance,
  };
}

function launchFactory({ instance, closeHandler }) {
  return ({ port }) => {
    ['SIGINT', 'SIGTERM'].forEach(function(signal) {
      process.on(signal, function() {
        instance.close(closeHandler(process.exit));
      });
    });

    return instance.listen(port, () => {
      if (process.env.NODE_ENV === 'test') return;
      console.info(
        `Server has launched from http://localhost:${instance.address().port}`,
      );
    });
  };
}
