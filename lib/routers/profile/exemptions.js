const { Router } = require('express');
const { validateSchema } = require('../../middleware');

const submit = action => (req, res, next) => {
  const params = {
    model: 'exemption'
  };

  return Promise.resolve()
    .then(() => {
      if (action === 'create') {
        return req.workflow.create(req, {
          ...params,
          data: { profileId: req.profileId }
        });
      }
      if (action === 'delete') {
        return req.workflow.delete(req, {
          ...params,
          id: req.exemptionId
        });
      }
    })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const validateExemption = () => (req, res, next) => {
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

router.post('/', validateExemption(), submit('create'));

router.delete('/:exemptionId', submit('delete'));

module.exports = router;
