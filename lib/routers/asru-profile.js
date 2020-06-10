const { Router } = require('express');
const { permissions } = require('../middleware');
const { NotFoundError } = require('../errors');

const app = Router({ mergeParams: true });

app.param('id', (req, res, next, id) => {
  const { Profile } = req.models;
  Profile.query().findById(req.params.id)
    .then(profile => {
      if (!profile || !profile.asruUser) {
        return next(new NotFoundError());
      }
      req.profile = profile;
      next();
    })
    .catch(next);
});

app.get('/:id', permissions('asruProfile'), (req, res, next) => {
  res.response = req.profile;
  next();
});

module.exports = app;
