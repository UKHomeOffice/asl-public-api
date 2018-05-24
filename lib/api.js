const api = require('@asl/service/api');
const db = require('@asl/schema');

const errorHandler = require('./error-handler');

const {omit} = require('lodash');

module.exports = settings => {
  const app = api(settings);

  const models = db(settings.db);

  app.db = models;

  app.use((req, res, next) => {
    req.models = models;
    next();
  });

  app.use('/establishment(s)?', require('./routers/establishment'));

  app.use((req, res, next) => {
    if (res.response) {
      const response = {
        data: res.response
      };
      if (req.establishment) {
        response.meta = {
          establishment: omit(req.establishment.toJSON(), 'places', 'roles')
        };
      }
      return res.json(response);
    }
    next();
  });

  app.use((req, res, next) => {
    next({ message: 'Not found', status: 404 });
  });

  app.use(errorHandler());

  return app;

};
