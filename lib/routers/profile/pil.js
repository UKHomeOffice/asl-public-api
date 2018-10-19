const { NotFoundError } = require('../../errors');
const { permissions, validateSchema } = require('../../middleware');
const isUUID = require('uuid-validate');
const { Router } = require('express');

const router = Router({ mergeParams: true });

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'pil',
      data: {
        ...req.body,
        establishmentId: req.establishment.id,
        profileId: req.user.profile.id
      },
      id: res.pil && res.pil.id
    };

    req.workflow(params)
      .then(response => {
        res.response = response.json.state;
        next();
      })
      .catch(next);
  };
};

const validate = (req, res, next) => {
  return validateSchema(req.models.PIL, {
    ...(res.pil || {}),
    establishmentId: req.establishment.id,
    profileId: req.user.profile.id
  })(req, res, next);
};

router.param('pil', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }

  const { PIL } = req.models;

  Promise.resolve()
    .then(() => {
      return PIL.query().findOne({ id, profileId: req.profileId });
    })
    .then(pil => {
      if (!pil) {
        throw new NotFoundError();
      }
      res.pil = pil;
      next();
    })
    .catch(next);
});

router.get('/:pil', (req, res, next) => {
  res.response = res.pil;
  next();
});

router.post('/',
  permissions('pil.create'),
  validate,
  submit('create')
);

router.put('/:pil',
  permissions('pil.update'),
  validate,
  submit('update')
);

router.delete('/:pil', permissions('pil.delete'), submit('delete'));

module.exports = router;
