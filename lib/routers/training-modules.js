const { Router } = require('express');
const { omit } = require('lodash');

const submit = (action) => {
  return (req, res, next) => {
    const certificate = omit(req.body, 'modules');
    const requests = req.body.modules.map(module => {
      const params = {
        action,
        model: 'trainingModule',
        data: { ...certificate, module }
      };
      return req.workflow(params);
    });

    return Promise.all(requests)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const validateSchema = () => {
  return (req, res, next) => {
    let data = { ...req.body };
    if (res.module) {
      data = Object.assign({}, res.module, data);
    }

    const { TrainingModule } = req.models;
    const error = TrainingModule.validate(data);

    return error ? next(error) : next();
  };
};

const deleteModules = () => {
  return (req, res, next) => {
    const requests = req.body.modules.map(moduleId => {
      const params = {
        action: 'delete',
        model: 'trainingModule',
        id: moduleId
      };
      return req.workflow(params);
    });

    Promise.all(requests)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const router = Router({ mergeParams: true });

router.post('/', validateSchema(), submit('create'));

router.delete('/', deleteModules());

module.exports = router;
