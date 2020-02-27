const api = require('@asl/service/api');
const db = require('@asl/schema');

const { NotFoundError } = require('./errors');

const rateLimiter = require('./middleware/rate-limiter');
const errorHandler = require('./error-handler');

module.exports = settings => {

  const app = api(settings);
  const models = db(settings.db);

  app.db = models;

  if (settings.limiter && settings.limiter.total) {
    app.use(rateLimiter(settings));
  }

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use((req, res, next) => {
    res.meta = {};
    next();
  });

  app.use(require('./middleware/user'));
  app.use(require('./middleware/permissions-bypass'));
  app.use('/me', require('./routers/user'));
  app.use('/invitation', require('./routers/invitation'));
  app.use('/establishment(s)?', require('./routers/establishment'));
  app.use('/task(s)?', require('./routers/task'));

  app.use((req, res, next) => {
    if (res.response) {
      const response = {
        data: res.response
      };
      response.meta = Object.assign({}, res.meta);
      if (req.establishment) {
        response.meta.establishment = {
          id: req.establishment.id,
          name: req.establishment.name,
          status: req.establishment.status,
          revocationDate: req.establishment.revocationDate,
          issueDate: req.establishment.issueDate
        };
      }
      return res.json(response);
    }
    next();
  });

  app.use((req, res, next) => {
    next(new NotFoundError());
  });

  app.use(errorHandler());

  return app;

};
