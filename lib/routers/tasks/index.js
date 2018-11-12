const { Router } = require('express');
const router = Router({ mergeParams: true });

const fetchTasks = () => {
  return (req, res, next) => {
    const params = {
      action: 'read',
      query: {
        data: {
          subject: req.user.profile.id
        },
        ...req.query
      }
    };

    return req.workflow(params)
      .then((response) => {
        res.meta.count = response.json.total;
        res.response = response.json.data;
        next();
      })
      .catch(next);
  };
};

router.use('/', fetchTasks());

module.exports = router;
