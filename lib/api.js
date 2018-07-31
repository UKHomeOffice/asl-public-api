const api = require('@asl/service/api');
const db = require('@asl/schema');

const { NotFoundError } = require('./errors');

const Workflow = require('./workflow/client');

const errorHandler = require('./error-handler');

module.exports = settings => {
  const app = api(settings);

  const models = db(settings.db);

  app.db = models;

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use(Workflow(settings));

  app.use((req, res, next) => {
    res.meta = {};
    next();
  });

  app.use('/establishment(s)?', require('./routers/establishment'));

  app.use((req, res, next) => {
    if (res.response) {
      const response = {
        data: res.response
      };
      response.meta = Object.assign({}, res.meta);
      if (req.establishment) {
        response.meta.establishment = {
          id: req.establishment.id,
          name: req.establishment.name
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
