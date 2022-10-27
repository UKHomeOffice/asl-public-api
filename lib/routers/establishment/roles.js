const { Router } = require('express');
const { NotFoundError } = require('../../errors');
const { fetchOpenTasks, permissions, whitelist, updateDataAndStatus } = require('../../middleware');

const router = Router({ mergeParams: true });

const submit = (action) => {

  return (req, res, next) => {
    const params = {
      model: 'role',
      data: {
        ...req.body.data,
        profileId: req.body.data.profileId,
        establishmentId: req.establishment.id
      },
      meta: req.body.meta,
      id: req.params.id
    };

    return Promise.resolve()
      .then(() => {
        switch (action) {
          case 'create':
            if (params.data.replaceProfile) {
              return req.workflow.update({...params, id: params.data.replaceProfile.id, action: 'replace'});
            }
            return req.workflow.create(params);
          case 'delete':
            return req.workflow.delete(params);
        }
      })
      .then(response => {
        res.response = response.json.data;
        next();
      })
      .catch(next);
  };
};

router.get('/', (req, res, next) => {
  const { Role } = req.models;
  const { type } = req.query;
  Promise.resolve()
    .then(() => {
      return Role.query()
        .skipUndefined()
        .where({
          type,
          establishmentId: req.establishment.id
        })
        .eager('[profile, places]');
    })
    .then(result => {
      res.response = result;
      next();
    })
    .catch(next);
});

router.param('id', (req, res, next, id) => {
  const { Role } = req.models;
  const { withDeleted } = req.query;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';
  Promise.resolve()
    .then(() => {
      return Role[queryType]()
        .findById(id)
        .where('establishmentId', req.establishment.id)
        .eager('[profile, places]');
    })
    .then(role => {
      if (!role) {
        throw new NotFoundError();
      }
      req.role = role;
      next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  res.response = req.role;
  next();
}, fetchOpenTasks());

router.post('/',
  permissions('profile.roles'),
  whitelist('profileId', 'type', 'comment', 'rcvsNumber', 'replaceProfile', 'replaceRoles'),
  updateDataAndStatus(),
  submit('create')
);

router.delete('/:id',
  permissions('profile.roles'),
  whitelist('profileId', 'comment'),
  submit('delete')
);

module.exports = router;
