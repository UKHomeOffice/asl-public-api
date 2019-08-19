const { Router } = require('express');
const { permissions, validateSchema, whitelist } = require('../../middleware');

const router = Router({ mergeParams: true });

const create = (req, res, next) => {
  const params = {
    model: 'invitation',
    data: {
      ...req.body.data,
      establishmentId: req.establishment.id
    }
  };
  req.workflow.create(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validateInvitation = (req, res, next) => {
  return validateSchema(req.models.Invitation, {
    token: 'abc123',
    email: req.body.data.email,
    establishmentId: req.establishment.id,
    role: req.body.data.role
  })(req, res, next);
};

const preventDuplicateInvite = (req, res, next) => {
  return Promise.resolve()
    .then(() => {
      return req.models.Profile.query()
        .scopeToEstablishment('establishments.id', req.establishment.id)
        .where('profiles.email', 'iLike', req.body.data.email)
        .first();
    })
    .then(profile => {
      if (profile) {
        const error = new Error(`This user is already associated with ${req.establishment.name}`);
        error.status = 400;
        throw error;
      }
    })
    .then(() => next())
    .catch(error => next(error));
};

router.post('/',
  permissions('profile.invite'),
  whitelist('email', 'role', 'firstName', 'lastName'),
  validateInvitation,
  preventDuplicateInvite,
  create
);

module.exports = router;
