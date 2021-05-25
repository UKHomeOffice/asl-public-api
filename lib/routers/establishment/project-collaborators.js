const { Router } = require('express');
const { intersection } = require('lodash');
const { BadRequestError, NotFoundError } = require('../../errors');
const { permissions, whitelist } = require('../../middleware');

const app = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    model: 'projectProfile',
    establishmentId: req.establishment.id,
    data: {
      ...req.body.data,
      profileId: req.profileId,
      projectId: req.project.id
    },
    id: null
  };
  req.workflow[action](params)
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

function validateUser(req, res, next) {
  const { Profile } = req.models;
  const allowedEstablishments = [req.project.establishmentId];
  req.project.additionalEstablishments.forEach(e => allowedEstablishments.push(e.id));
  Promise.resolve()
    .then(() => Profile.query().findById(req.profileId).eager('establishments'))
    .then(profile => {
      if (intersection(profile.establishments.map(e => e.id), allowedEstablishments).length) {
        return next();
      }
      return next(new BadRequestError('User is not associated with project establishment'));
    })
    .catch(next);
}

function establishmentCanUpdate(req, res, next) {
  return req.models.Project.query().findById(req.project.id).whereHasAvailability(req.establishment.id)
    .then(project => {
      if (project) {
        return next();
      }
      return new NotFoundError();
    });
}

app.param('profileId', (req, res, next, profileId) => {
  const { ProjectProfile } = req.models;
  Promise.resolve()
    .then(() => ProjectProfile
      .query()
      .select('role', 'profileId', 'profile.firstName', 'profile.lastName', 'profile.email')
      .findOne({ profileId, projectId: req.project.id })
      .leftJoinRelation('profile')
    )
    .then(collaborator => {
      req.profileId = profileId;
      req.collaborator = collaborator;
    })
    .then(() => next())
    .catch(next);
});

app.get('/:profileId', permissions('project.manageAccess'), (req, res, next) => {
  res.response = req.collaborator;
  next();
});

app.post('/:profileId',
  permissions('project.manageAccess'),
  establishmentCanUpdate,
  validateUser,
  whitelist('role'),
  submit('create')
);

app.put('/:profileId',
  permissions('project.manageAccess'),
  establishmentCanUpdate,
  validateUser,
  whitelist('role'),
  submit('update')
);

app.delete('/:profileId',
  permissions('project.manageAccess'),
  establishmentCanUpdate,
  submit('delete')
);

module.exports = app;
