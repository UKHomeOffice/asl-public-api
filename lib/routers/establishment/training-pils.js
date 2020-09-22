const { Router } = require('express');
const { permissions, whitelist } = require('../../middleware');
const { NotFoundError, BadRequestError } = require('../../errors');

const submit = action => (req, res, next) => {
  const params = {
    model: 'trainingPil',
    data: {
      ...(req.body.data || req.body),
      trainingCourseId: req.trainingCourseId,
      establishmentId: req.establishment.id
    },
    meta: req.body.meta,
    establishmentId: req.establishment.id
  };
  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create(params);
        case 'revoke':
          return req.workflow.update({ ...params, action: 'revoke', id: req.trainingPilId });
      }
    })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

async function checkUnique(req, res, next) {
  const { TrainingPil, Profile } = req.models;
  const { email } = req.body.data;
  const profile = await Profile.query().findOne({ email });
  if (!profile) {
    return next();
  }

  const trainingPil = await TrainingPil.query().findOne({ trainingCourseId: req.trainingCourseId, profileId: profile.id });

  if (trainingPil) {
    return next(new BadRequestError('User has already been added to this training course'));
  }

  next();
}

const app = Router({ mergeParams: true });

app.post('/', permissions('trainingCourse.update'), checkUnique, submit('create'));

app.get('/', permissions('trainingCourse.read'), (req, res, next) => {
  const { limit, offset, sort } = req.query;
  const { TrainingPil } = req.models;
  Promise.all([
    TrainingPil.query().where({ trainingCourseId: req.trainingCourseId }).count(),
    TrainingPil.list({
      trainingCourseId: req.trainingCourseId,
      sort,
      limit,
      offset
    })
  ])
    .then(([total, pils]) => {
      res.meta.total = total.count;
      res.meta.count = pils.total;
      res.response = pils.results;
      next();
    })
    .catch(next);
});

app.param('trainingPilId', (req, res, next, id) => {
  const { TrainingPil } = req.models;
  TrainingPil.query().findById(id).withGraphFetched('[profile, trainingCourse.[project, establishment]]')
    .then(trainingPil => {
      if (!trainingPil) {
        return next(new NotFoundError());
      }

      trainingPil.licenceNumber = trainingPil.profile.pilLicenceNumber;
      req.trainingPil = trainingPil;
      req.trainingPilId = id;
      next();
    })
    .catch(next);
});

app.get('/:trainingPilId', permissions('trainingCourse.read'), (req, res, next) => {
  res.response = req.trainingPil;
  next();
});

app.put('/:trainingPilId/revoke',
  permissions('trainingCourse.update'),
  whitelist('comments'),
  submit('revoke')
);

module.exports = app;
