const { Router } = require('express');
const { permissions, whitelist } = require('../../middleware');

const submit = (action) => {

  return (req, res, next) => {
    const params = {
      model: 'role',
      data: {
        ...req.body.data,
        profileId: req.profileId,
        establishmentId: req.establishment.id
      },
      meta: req.body.meta,
      id: req.profileId
    };

    return Promise.resolve()
      .then(() => {
        switch (action) {
          case 'create':
            return req.workflow.create(params);
          case 'delete':
            return req.workflow.delete(params);
        }
      })
      .then(response => {
        res.response = response;
        next();
      })
      .catch(next);
  };
};

const router = Router({ mergeParams: true });

router.put('/',
  permissions('profile.roles'),
  whitelist('role', 'comment', 'rcvsNumber'),
  submit('create')
);

router.delete('/',
  permissions('profile.roles'),
  whitelist('role', 'comment'),
  submit('delete')
);

module.exports = router;
