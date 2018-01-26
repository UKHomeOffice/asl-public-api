const api = require('asl-service/api');

const errorHandler = require('./error-handler');

module.exports = settings => {

  const app = api(settings);

  app.use((req, res) => {
    res.json({ hello: 'world' });
  });

  app.use(errorHandler());

  return app;

};
