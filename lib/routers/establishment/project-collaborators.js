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
      profileId: req.params.profileId,
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
  const { profileId } = req.params;
  const allowedEstablishments = [req.project.establishmentId];
  req.project.additionalEstablishments.forEach(e => allowedEstablishments.push(e.id));
  Promise.resolve()
    .then(() => Profile.query().findById(profileId).eager('establishments'))
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

app.post('/:profileId',
  permissions('project.manageAccess'),
  establishmentCanUpdate,
  validateUser,
  whitelist(),
  submit('create')
);

app.delete('/:profileId',
  permissions('project.manageAccess'),
  establishmentCanUpdate,
  whitelist(),
  submit('delete')
);

module.exports = app;
