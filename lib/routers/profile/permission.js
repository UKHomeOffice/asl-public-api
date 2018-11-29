const { Router } = require('express');

const submit = (action) => {

  return (req, res, next) => {

    const params = {
      action,
      model: 'permissions',
      data: {
        ...req.body
      },
      id: req.profileId
    };

    req.workflow(params)
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
