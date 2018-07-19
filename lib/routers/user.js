const { Router } = require('express');

const router = Router();

router.get('/', (req, res, next) => {

  const { Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.query()
        .where({ userId: req.user.id })
        .eager('establishments');
    })
    .then(profiles => profiles[0])
    .then(profile => {
      res.response = profile;
      next();
    })
    .catch(next);

});

module.exports = router;
