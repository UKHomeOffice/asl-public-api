const { Router } = require('express');
const { get } = require('lodash');
const { NotFoundError, BadRequestError, UnrecognisedActionError } = require('../../errors');
const { fetchOpenTasks, permissions, validateSchema, whitelist, updateDataAndStatus } = require('../../middleware');
const { attachReviewDue } = require('../../helpers/pils');
const isUUID = require('uuid-validate');

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
      res.response = response.json.data;
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
  const pilActions = ['grant', 'revoke', 'transfer', 'review'];

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

const attachEstablishmentDetails = (req, res, next) => {
  const establishmentId = req.pil.establishmentId;
  const { Establishment } = req.models;
  return Promise.resolve()
    .then(() => req.user.can('establishment.read', { establishment: req.pil.establishmentId }))
    .then(can => {
      if (can) {
        return Promise.resolve()
          .then(() => Establishment.query().findById(establishmentId).select('name', 'address'))
          .then(establishment => {
            req.pil.establishment = establishment;
          });
      }
    })
    .then(() => next())
    .catch(next);
};

router.param('pilId', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }

  const { PIL } = req.models;
  const { withDeleted } = req.query;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';

  Promise.resolve()
    .then(() => {
      return PIL[queryType]().findById(id)
        .select([
          'pils.*',
          'profile.pilLicenceNumber as licenceNumber'
        ])
        .joinRelation('profile')
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
      pil.procedures = pil.procedures || [];
      pil.species = pil.species || [];
      req.pil = pil;
      next();
    })
    .catch(next);
});

router.get('/:pilId',
  permissions('pil.read'),
  attachEstablishmentDetails,
  (req, res, next) => {
    res.response = attachReviewDue(req.pil, 3, 'months');
    next();
  },
  fetchOpenTasks()
);

router.post('/',
  permissions('pil.create'),
  whitelist(),
  validate,
  submit('create')
);

router.put('/:pilId/:action',
  checkEstablishment,
  validateAction,
  validate
);

router.put('/:pilId/review',
  // user must have update OR review permissions
  permissions(['pil.update', 'pil.review']),
  whitelist(),
  submit('review')
);

router.put('/:pilId/grant',
  permissions('pil.update'),
  whitelist('procedures', 'notesCatD', 'notesCatF', 'species'),
  updateDataAndStatus(),
  submit('grant')
);

router.put('/:pilId/revoke',
  permissions('pil.update'),
  whitelist('comments'),
  updateDataAndStatus(),
  submit('revoke')
);

router.put('/:pilId/transfer',
  permissions('pil.transfer'),
  whitelist('procedures', 'notesCatD', 'notesCatF', 'species', 'establishment'),
  updateDataAndStatus(),
  (req, res, next) => {
    const { Profile } = req.models;
    req.establishment.id = get(req.body.data, 'establishment.to.id');

    return Profile.query().findById(req.profileId).eager('[establishments]')
      .then(profile => {
        if (!profile.establishments.find(e => e.id === req.establishment.id)) {
          return next(new BadRequestError('Can only transfer a PIL to establishments the user is associated with'));
        }
      })
      .then(() => next());
  },
  submit('transfer')
);

router.delete('/:pilId',
  whitelist(),
  permissions('pil.delete'),
  checkEstablishment,
  submit('delete')
);

module.exports = router;
