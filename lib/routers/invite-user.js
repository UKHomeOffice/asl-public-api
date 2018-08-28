const { pick } = require('lodash');
const { Router } = require('express');
const permissions = require('../middleware/permissions');

const router = Router({ mergeParams: true });

const submit = action => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'invitation',
      data: { ...req.body, establishment: req.establishment.id },
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

const validateSchema = () => {
  return (req, res, next) => {
    const { Invitation, Profile } = req.models;

    const invitationProps = {
      // pass dummy UUID as the profile has not been created at this point.
      // profileId is added, and will be validated at time of insertion
      profileId: 'e564bf87-319c-4d5b-a266-d70cda895a30',
      establishmentId: req.establishment.id,
      role: req.body.role
    };

    let error = Invitation.validate(invitationProps);

    if (error) {
      return next(error);
    }

    const profileProps = pick(req.body, ['firstName', 'lastName', 'email']);

    error = Profile.validate(profileProps);

    if (error) {
      return next(error);
    }

    return next();
  };
};

router.post('/', permissions('profile.invite'), validateSchema(), submit('create'));

module.exports = router;
