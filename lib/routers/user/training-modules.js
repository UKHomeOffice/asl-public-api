const { Router } = require('express');

const submit = (action) => {
  return (req, res, next) => {
    const params = {
      action,
      model: 'trainingModule',
      data: { ...req.body }
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
    let data = {
      profileId: req.profile.id,
      ...req.body
    };
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
      action: 'delete',
      model: 'trainingModule',
      id: req.params.id
    };
    return req.workflow(params)
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const router = Router({ mergeParams: true });

router.post('/', validateSchema(), submit('create'));

router.delete('/:id', deleteModules());

module.exports = router;
