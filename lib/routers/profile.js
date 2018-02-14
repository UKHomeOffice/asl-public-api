const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/:id', (req, res, next) => {
  const { Role, Profile, Place } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.findOne({
        where: { id: req.params.id },
        include: {
          model: Role,
          include: {
            model: Place
          }
        }
      });
    })
    .then(profile => {
      res.response = profile;
      next();
    })
    .catch(next);
});

module.exports = router;
