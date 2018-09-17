const { Router } = require('express');
// const isUUID = require('uuid-validate');
// const { NotFoundError } = require('../errors');
// const permissions = require('../middleware/permissions');
const { omit } = require('lodash');
const submit = (action) => {

  return (req, res, next) => {

    console.log('REQ BODY : ', req.body);

    // create 3 objects from req body - or as many as modules there are

    const params = {
      action,
      model: 'trainingModule',
      // data: { ...req.body, establishment: req.establishment.id },
      data: req.body.modules.map(m => {
        return { ...omit(req.body, 'modules'), module: m };
      })
    };
    console.log('SUBMIT MODULE: ', params);
    req.workflow(params)
      .then(response => {
        res.response = response;
        console.log('SUBMIT RESPONSE ', response);
        next();
      })
      .catch(next);
  };
};

const validateSchema = () => {

  return (req, res, next) => {
    // let data = { ...req.body, establishmentId: req.establishment.id };

    let data = { ...req.body };
    if (res.module) {
      data = Object.assign({}, res.module, data);
    }

    console.log('AVAILABLE MODELS ', req.models);

    const { TrainingModule } = req.models;
    const error = TrainingModule.validate(data);

    return error ? next(error) : next();
  };
};

const router = Router({ mergeParams: true });

// router.param('id', (req, res, next, id) => {
//   if (!isUUID(id)) {
//     return next(new NotFoundError());
//   }
//   const { Module } = req.models;
//   Promise.resolve()
//     .then(() => {
//       return Module.query()
//         .findById(req.params.id)
//         .where('establishmentId', req.establishment.id)
//         .eager('nacwo.profile');
//     })
//     .then(place => {
//       if (!place) {
//         throw new NotFoundError();
//       }
//       res.place = place;
//       next();
//     })
//     .catch(next);
// });

// router.post('/', permissions('module.create'), validateSchema(), submit('create'));

router.post('/', validateSchema(), submit('create'));

// router.get('/:id', (req, res, next) => {
//   res.response = res.place;
//   next();
// });

module.exports = router;
