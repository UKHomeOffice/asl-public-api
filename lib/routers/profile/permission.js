const { Router } = require('express');
const { permissions, whitelist } = require('../../middleware');

const submit = (action) => {

  return (req, res, next) => {
    const params = {
      model: 'permissions',
      data: {
        ...req.body.data,
        profileId: req.profileId,
        establishmentId: req.establishment.id
      },
      id: req.profileId
    };

    return Promise.resolve()
      .then(() => {
        switch (action) {
          case 'update':
            return req.workflow.update(params);
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
  permissions('profile.permissions'),
  whitelist('role'),
  submit('update')
);

router.delete('/',
  permissions('profile.permissions'),
  whitelist(),
  submit('delete')
);

module.exports = router;
