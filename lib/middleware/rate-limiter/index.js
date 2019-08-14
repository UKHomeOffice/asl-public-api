const redis = require('redis');
const { RateLimitedError } = require('../../errors');

const limiter = require('./express-limiter');

module.exports = settings => {
  const client = redis.createClient(settings.redis);
  client.on('error', e => console.error(e.message));

  return limiter(client)({
    lookup: ['user.id'],
    total: settings.limiter.total,
    expire: 1000 * 60 * 60,
    whitelist: req => {
      if (req.path === '/me') {
        return true;
      }
      if (req.method === 'PUT' && req.path.match(/\/project-versions\/([a-z0-9-]+)\/(update|patch)$/)) {
        return true;
      }
      return false;
    },
    ignoreErrors: false,
    onRateLimited: function (req, res, next) {
      next(new RateLimitedError());
    }
  });
};
