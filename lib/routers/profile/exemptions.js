const { Router } = require('express');
const { validateSchema } = require('../../middleware');

const submit = action => (req, res, next) => {
  const params = {
    action,
    model: 'exemption',
    data: {
      ...req.body,
      profileId: req.profileId
    },
    id: req.exemptionId
  };

  return req.workflow(params)
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validateExemption = (req, res, next) => {
  return validateSchema(req.models.Exemption, {
    ...req.body,
    profileId: req.profileId
  })(req, res, next);
};

const router = Router();

router.param('exemptionId', (req, res, next, exemptionId) => {
  req.exemptionId = exemptionId;
  next();
});

router.post('/', validateExemption, submit('create'));

router.delete('/:exemptionId', submit('delete'));

module.exports = router;
