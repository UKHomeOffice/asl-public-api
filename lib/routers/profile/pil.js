const { get } = require('lodash');
const { NotFoundError, BadRequestError } = require('../../errors');
const { fetchOpenTasks, permissions, validateSchema, whitelist, updateDataAndStatus } = require('../../middleware');
const isUUID = require('uuid-validate');
const { Router } = require('express');
const { UnrecognisedActionError } = require('../../errors');

const router = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    data: {
      ...req.body.data,
      establishmentId: req.establishment.id,
      profileId: req.profileId
    },
    meta: req.body.meta,
    model: 'pil'
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create(params);
        case 'delete':
          return req.workflow.delete({
            ...params,
            id: req.pil.id
          });
        default:
          return req.workflow.update({
            ...params,
            action: action || req.params.action,
            id: req.pil.id
          });
      }
    })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validate = (req, res, next) => {
  return validateSchema(req.models.PIL, {
    ...(req.pil || {}),
    establishmentId: req.establishment.id,
    profileId: req.profileId
  })(req, res, next);
};

const validateAction = (req, res, next) => {
  const pilActions = ['grant', 'revoke', 'transfer'];

  if (!pilActions.includes(req.params.action)) {
    return next(new UnrecognisedActionError());
  }

  next();
};

const checkEstablishment = (req, res, next) => {
  if (req.pil.establishmentId !== req.establishment.id) {
    return next(new BadRequestError());
  }
  next();
};

router.param('pil', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }

  const { PIL } = req.models;
  const { withDeleted } = req.query;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';

  Promise.resolve()
    .then(() => {
      return PIL[queryType]().findById(id)
        .where(builder => {
          if (req.profileId) {
            return builder.where({ profileId: req.profileId });
          }
        });
    })
    .then(pil => {
      if (!pil) {
        throw new NotFoundError();
      }
      req.pil = pil;
      next();
    })
    .catch(next);
});

router.get('/:pil',
  permissions('pil.read'),
  (req, res, next) => {
    res.response = req.pil;
    next();
  },
  fetchOpenTasks
);

router.post('/',
  permissions('pil.create'),
  whitelist(),
  validate,
  submit('create')
);

router.put('/:pil/:action',
  permissions('pil.update'),
  checkEstablishment,
  validateAction,
  validate
);

router.put('/:pil/grant',
  whitelist('procedures', 'notesCatD', 'notesCatF', 'species'),
  updateDataAndStatus(),
  submit('grant')
);

router.put('/:pil/revoke',
  whitelist('comments'),
  updateDataAndStatus(),
  submit('revoke')
);

router.put('/:pil/transfer',
  whitelist('procedures', 'notesCatD', 'notesCatF', 'species', 'establishment'),
  updateDataAndStatus(),
  (req, res, next) => {
    req.establishment.id = get(req.body.data, 'establishment.to.id');
    if (!req.user.profile.establishments.find(e => e.id === req.establishment.id)) {
      return next(new BadRequestError('Can only transfer a PIL to establishments the user is associated with'));
    }
    next();
  },
  submit('transfer')
);

router.delete('/:pil',
  whitelist(),
  permissions('pil.delete'),
  checkEstablishment,
  submit('delete')
);

module.exports = router;
