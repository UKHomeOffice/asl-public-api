const api = require('@asl/service/api');
const db = require('@asl/schema');
const { NotFoundError } = require('./errors');
const errorHandler = require('./error-handler');
const Keycloak = require('./helpers/keycloak');

module.exports = settings => {

  const app = api(settings);
  const models = db(settings.db);
  const keycloak = Keycloak(settings.auth);

  app.db = models;

  app.use((req, res, next) => {
    req.models = models;
    req.keycloak = keycloak;
    next();
  });

  app.use((req, res, next) => {
    res.meta = {};
    next();
  });

  app.use(require('./middleware/user'));
  app.use(require('./middleware/permissions-bypass'));
  app.use('/me', require('./routers/user'));
  app.use('/asru-profile', require('./routers/asru-profile'));
  app.use('/invitation', require('./routers/invitation'));
  app.use('/establishment(s)?', require('./routers/establishment'));
  app.use('/task(s)?', require('./routers/task'));

  app.use((req, res, next) => {
    if (res.response) {
      const response = {};
      if (!req.query.onlymeta) {
        response.data = res.response;
      }
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
