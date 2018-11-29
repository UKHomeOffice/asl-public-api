const { Router } = require('express');
const permissions = require('../../middleware/permissions');
const validateSchema = require('../../middleware/validate-schema');

const router = Router({ mergeParams: true });

const create = (req, res, next) => {
  const params = {
    model: 'invitation',
    data: {
      ...(req.body.data || req.body),
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
    email: req.body.email,
    establishmentId: req.establishment.id,
    role: req.body.role
  })(req, res, next);
};

router.post('/',
  permissions('profile.invite'),
  validateInvitation,
  create
);

module.exports = router;
