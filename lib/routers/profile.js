const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Role, Profile, Place } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.findAll({
        include: {
          model: Role,
          include: {
            model: Place
          }
        }
      });
    })
    .then(profiles => {
      res.response = profiles.map(profile => ({
        ...profile.dataValues,
        roles: profile.roles.map(r => r.type)
      }));
      next();
    })
    .catch(next);
});

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
