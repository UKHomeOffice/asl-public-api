const { Router } = require('express');
const router = Router({ mergeParams: true });

const fetchTasks = () => {
  return (req, res, next) => {
    const params = {
      action: 'read',
      query: {
        data: {
          subject: req.user.profile.id
        }
      }
    };

    console.log('fetch tasks params: ', params);

    return req.workflow(params)
      .then(response => {
        res.response = response.json.data;
        res.meta.count = response.json.data.length;
        next();
      })
      .catch(next);
  };
};

router.use('/', fetchTasks());

module.exports = router;
