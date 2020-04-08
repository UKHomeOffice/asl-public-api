const { Router } = require('express');
const { BadRequestError } = require('../../errors');
const { permissions, whitelist } = require('../../middleware');

const app = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    model: 'projectProfile',
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
  Promise.resolve()
    .then(() => Profile.query().findById(profileId).eager('establishments'))
    .then(profile => {
      if (profile.establishments.find(e => e.id === req.project.establishmentId)) {
        return next();
      }
      return next(new BadRequestError('User is not associated with project establishment'));
    })
    .catch(next);
}

app.post('/:profileId',
  permissions('project.update'),
  validateUser,
  whitelist(),
  submit('create')
);

app.delete('/:profileId',
  permissions('project.update'),
  whitelist(),
  submit('delete')
);

module.exports = app;
