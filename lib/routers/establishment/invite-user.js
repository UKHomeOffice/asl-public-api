const { pick } = require('lodash');
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
    email: req.body.email,
    establishmentId: req.establishment.id,
    role: req.body.role
  })(req, res, next);
};

router.get('/:token', (req, res, next) => {
  const { Invitation } = req.models;
  Invitation.query().where({ token: req.params.token })
    .then(result => result[0])
    .then(result => {
      res.response = result;
      next();
    })
    .catch(next);
});

router.put('/:token', (req, res, next) => {
  const { Invitation } = req.models;
  Invitation.query().where({ token: req.params.token })
    .then(result => result[0])
    .then(result => {
      req.body = {
        id: result.id,
        profileId: req.user.profile.id
      };
      next();
    })
    .catch(next);
}, submit('accept'));

router.post('/',
  permissions('profile.invite'),
  validateInvitation,
  submit('create')
);

module.exports = router;
