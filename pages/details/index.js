const page = require('../../lib/page');
const { setEstablishment } = require('../../lib/actions');

module.exports = settings => {
  const app = page({
    ...settings,
    root: __dirname,
    reducers: [
      'establishment'
    ]
  });

  app.get('/', (req, res, next) => {
    req.api(`/establishment/${req.establishment}`)
      .then(response => {
        res.data = response.json.data;
      })
      .then(() => next())
      .catch(next);
  });

  app.get('/', (req, res, next) => {
    res.store.dispatch(setEstablishment(res.data));
    next();
  });

  return app;
};