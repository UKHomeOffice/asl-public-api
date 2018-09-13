const redis = require('redis');
const limiter = require('express-limiter');

const { RateLimitedError } = require('../errors');

module.exports = settings => {
  const client = redis.createClient(settings.redis);

  return limiter(null, client)({
    lookup: ['user.id'],
    total: settings.limiter.total,
    expire: 1000 * 60 * 60,
    whitelist: req => req.path === '/me',
    onRateLimited: function (req, res, next) {
      next(new RateLimitedError());
    }
  });
};
