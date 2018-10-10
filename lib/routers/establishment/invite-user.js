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
      },
      id: res.profile && res.profile.id
    };
    req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const validateProfile = (req, res, next) => {
  return validateSchema(req.models.Profile,
    pick(req.body, 'firstName', 'lastName', 'email')
  )(req, res, next);
};

const validateInvitation = (req, res, next) => {
  return validateSchema(req.models.Invitation, {
    // pass dummy UUID as the profile has not been created at this point.
    // profileId is added, and will be validated at time of insertion
    profileId: 'e564bf87-319c-4d5b-a266-d70cda895a30',
    establishmentId: req.establishment.id,
    role: req.body.role
  })(req, res, next);
};

router.post('/',
  permissions('profile.invite'),
  validateProfile,
  validateInvitation,
  submit('create')
);

module.exports = router;
