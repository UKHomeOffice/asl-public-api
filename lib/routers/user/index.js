const { omit } = require('lodash');
const { Router } = require('express');
const { NotFoundError } = require('../../errors');
const { validateSchema } = require('../../middleware');

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'profile',
      data: { ...req.body },
      id: req.profile && req.profile.id
    };

    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const validate = () => {
  return (req, res, next) => {
    const ignoredFields = ['comments'];
    return validateSchema(req.models.Profile, {
      ...(req.profile || {}),
      ...omit(req.body, ignoredFields)
    })(req, res, next);
  };
};

const router = Router();

router.get('/', (req, res, next) => {
  if (!req.profile) {
    return next(new NotFoundError());
  }
  res.response = req.profile;
  res.meta.allowedActions = req.allowedActions;
  next();
});

router.put('/', validate(), submit('update'));

router.use('/training', require('./training-modules'));

module.exports = router;
