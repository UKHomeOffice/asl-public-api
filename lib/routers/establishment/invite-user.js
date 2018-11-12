const { Router } = require('express');
const permissions = require('../../middleware/permissions');
const validateSchema = require('../../middleware/validate-schema');

const router = Router({ mergeParams: true });

const submit = action => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'invitation',
      data: {
        ...req.body,
        establishmentId: req.establishment.id
      }
    };
    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
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
  submit('create')
);

module.exports = router;
