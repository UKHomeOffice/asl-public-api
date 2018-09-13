const redis = require('redis');
const { RateLimitedError } = require('../../errors');

const limiter = require('./express-limiter');

module.exports = settings => {
  const client = redis.createClient(settings.redis);

  return limiter(client)({
    lookup: ['user.id'],
    total: settings.limiter.total,
    expire: 1000 * 60 * 60,
    whitelist: req => req.path === '/me',
    ignoreErrors: false,
    onRateLimited: function (req, res, next) {
      next(new RateLimitedError());
    }
  });
};
