const { Router } = require('express');
const { castArray } = require('lodash');

const submit = (action) => {
  return (req, res, next) => {
    Promise.all(
      castArray(req.body).map(data => {
        const params = {
          model: 'trainingModule',
          action,
          data
        };
        return req.workflow(params);
      })
    )
      .then(responses => {
        if (responses.length === 1) {
          responses = responses[0];
        }
        res.response = responses;
        next();
      })
      .catch(next);
  };
};

const validateSchema = () => {
  return (req, res, next) => {
    const validate = data => {
      data = {
        profileId: req.profile.id,
        ...data
      };
      if (res.module) {
        data = Object.assign({}, res.module, data);
      }

      const { TrainingModule } = req.models;
      const error = TrainingModule.validate(data);
      if (error) {
        return next(error);
      }
    };

    castArray(req.body).map(validate);
    return next();
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
