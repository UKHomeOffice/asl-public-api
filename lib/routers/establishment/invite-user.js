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

router.post('/',
  permissions('profile.invite'),
  whitelist('email', 'role', 'firstName', 'lastName'),
  validateInvitation,
  create
);

module.exports = router;
