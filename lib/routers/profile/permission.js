const { Router } = require('express');

const submit = (action) => {

  return (req, res, next) => {
    const params = {
      model: 'permissions',
      data: req.body.data || req.body,
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

router.put('/', submit('update'));

router.delete('/', submit('delete'));

module.exports = router;
