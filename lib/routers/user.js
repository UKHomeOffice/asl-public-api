const { Router } = require('express');
const { NotFoundError } = require('../errors');

const router = Router();

const validate = require('./profile/validate');
const submit = require('./profile/submit');

router.get('/', (req, res, next) => {
  if (!req.profile) {
    return next(new NotFoundError());
  }
  res.response = req.profile;
  res.meta.allowedActions = req.allowedActions;
  next();
});

router.put('/', (req, res, next) => {
  res.profile = req.profile;
  next();
}, validate(), submit('update'));

module.exports = router;
