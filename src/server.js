const micro = require('micro');
const querystring = require('querystring');

module.exports = {
  instance,
  start,
};

function instance(database) {
  return micro(async (request, response) => {
    if (request.method === 'POST') {
      const key = querystring.parse(await micro.text(request)).key;

      return database
        .get(key)
        .then(async count => {
          const newCount = Number(count) + 1;

          await database.put(key, newCount);

          response.setHeader('Content-Type', 'text/plain');
          return newCount;
        })
        .catch(error => {
          console.error(error);
          response.end();
        });
    }
  });
}

function start({ database, port }) {
  const server = instance(database);

  server.listen(port);

  process.on('SIGTERM', function() {
    server.close(function() {
      process.exit();
    });
  });
}
