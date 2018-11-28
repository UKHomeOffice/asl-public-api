const { NotFoundError } = require('../../errors');
const { permissions, validateSchema } = require('../../middleware');
const isUUID = require('uuid-validate');
const { Router } = require('express');
const { UnrecognisedActionError } = require('../../errors');

const router = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    data: {
      establishmentId: req.establishment.id,
      profileId: req.profileId
    },
    model: 'pil'
  };

  return Promise.resolve()
    .then(() => {
      if (action === 'create') {
        return req.workflow.create(req, params);
      }
      return req.workflow.update(req, {
        ...params,
        action: action || req.params.action,
        id: res.pil.id
      });
    })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validate = (req, res, next) => {
  return validateSchema(req.models.PIL, {
    ...(res.pil || {}),
    establishmentId: req.establishment.id,
    profileId: req.profileId
  })(req, res, next);
};

const validateAction = (req, res, next) => {
  const pilActions = ['grant', 'endorse', 'revoke'];

  if (!pilActions.includes(req.params.action)) {
    next(new UnrecognisedActionError());
  }

  next();
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

router.put('/:pil/:action',
  permissions('pil.update'),
  validateAction,
  validate,
  submit()
);

router.put('/:pil',
  permissions('pil.update'),
  validate,
  submit('update')
);

router.delete('/:pil', permissions('pil.delete'), submit('delete'));

module.exports = router;
