const { Router } = require('express');
const { omit } = require('lodash');

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'trainingModule',
      data: req.body.modules.map(m => {
        return { ...omit(req.body, 'modules'), module: m };
      })
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
    const params = {
      action: 'deleteMany',
      model: 'trainingModule',
      data: req.body.modules
    };

    req.workflow(params)
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
