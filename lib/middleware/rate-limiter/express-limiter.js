/*****
This is a port of npmjs.com/express-limiter with some minor functionality changes:

* Limits are global here, where in `express-limiter` they are applied per route/method
* Unused functionality is removed so `app` no longer needs to be passed as a parameter
* Updated code to ESmodernish
*****/

module.exports = db => {
  return opts => {
    return (req, res, next) => {
      if (opts.whitelist && opts.whitelist(req)) {
        return next();
      }
      opts.lookup = Array.isArray(opts.lookup) ? opts.lookup : [opts.lookup];
      opts.onRateLimited = typeof opts.onRateLimited === 'function' ? opts.onRateLimited : (req, res, next) => {
        res.status(429).send('Rate limit exceeded');
      };

      const lookups = opts.lookup.map(item => {
        return item + ':' + item.split('.').reduce((prev, cur) => {
          return prev[cur];
        }, req);
      }).join(':');
      const key = 'ratelimit:' + lookups;
      db.get(key, (err, limit) => {
        if (err && opts.ignoreErrors) {
          return next();
        }
        const now = Date.now();
        limit = limit ? JSON.parse(limit) : {
          total: opts.total,
          remaining: opts.total,
          reset: now + opts.expire
        };

        if (now > limit.reset) {
          limit.reset = now + opts.expire;
          limit.remaining = opts.total;
        }

        // do not allow negative remaining
        limit.remaining = Math.max(Number(limit.remaining) - 1, -1);

        db.set(key, JSON.stringify(limit), 'PX', opts.expire, function (e) {
          if (!opts.skipHeaders) {
            res.set('X-RateLimit-Limit', limit.total);
            res.set('X-RateLimit-Reset', Math.ceil(limit.reset / 1000));
            res.set('X-RateLimit-Remaining', Math.max(limit.remaining, 0));
          }

          if (limit.remaining >= 0) {
            return next();
          }

          const after = (limit.reset - Date.now()) / 1000;

          if (!opts.skipHeaders) {
            res.set('Retry-After', after);
          }

          opts.onRateLimited(req, res, next);
        });

      });
    };
  };
};
