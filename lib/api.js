const api = require('asl-service/api');

const errorHandler = require('./error-handler');

module.exports = settings => {

  const app = api(settings);

  const data = {
    oxf: {
      name: 'Oxford University'
    },
    cam: {
      name: 'Cambridge University'
    }
  };

  app.get('/establishment/:establishment', (req, res, next) => {
    if (!data[req.params.establishment]) {
      return next();
    }
    res.json(Object.assign({
      id: req.params.establishment
    }, data[req.params.establishment]));
  });

  app.use((req, res) => {
    res.status(404);
    res.json({ message: 'Not found' });
  });

  app.use(errorHandler());

  return app;

};
