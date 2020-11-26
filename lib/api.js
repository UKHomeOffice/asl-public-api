const api = require('@asl/service/api');
const db = require('@asl/schema');
const { NotFoundError } = require('./errors');
const errorHandler = require('./error-handler');
const userRouter = require('./routers/user');
const establishmentRouter = require('./routers/establishment');
const proxy = require('./middleware/proxy');

module.exports = settings => {

  const app = api(settings);
  const models = db(settings.db);

  app.db = models;

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use((req, res, next) => {
    res.meta = {};
    next();
  });

  // tell res.json() to strip any carriage returns from the response data
  app.set('json replacer', (key, value) => {
    if (typeof value === 'string') {
      return value.replace(/\r/g, '');
    }
    return value;
  });

  app.use(require('./middleware/user'));
  app.use(require('./middleware/permissions-bypass'));

  app.use('/search', proxy(`${settings.search}`));

  app.use('/me', userRouter(settings));
  app.use('/asru-profile', require('./routers/asru-profile'));
  app.use('/invitation', require('./routers/invitation'));
  app.use('/establishment(s)?', establishmentRouter(settings));
  app.use('/task(s)?', require('./routers/task'));

  app.use((req, res, next) => {
    if (!req.permissionChecked) {
      const nopes = ['/tasks', '/me'];
      if (!nopes.includes(req.path)) {
        req.log('info', { url: req.originalUrl, event: 'unchecked-permissions' });
      }
    }
    if (res.response !== undefined) {
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
          issueDate: req.establishment.issueDate,
          isTrainingEstablishment: req.establishment.isTrainingEstablishment
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
