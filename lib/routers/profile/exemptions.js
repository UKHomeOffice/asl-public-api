const { Router } = require('express');
const { validateSchema } = require('../../middleware');

const submit = action => (req, res, next) => {
  const params = {
    model: 'exemption',
    data: {
      ...req.body.data,
      profileId: req.profileId
    },
    meta: req.body.meta
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create(params);
        case 'delete':
          return req.workflow.delete({
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
    ...req.body.data,
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
