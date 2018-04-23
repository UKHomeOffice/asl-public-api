const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Role } = req.models;
  Promise.resolve()
    .then(() => {
      return req.establishment.getProfiles({
        include: Role
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
  const { Role, Place, Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.findOne({
        where: {
          id: req.params.id,
          establishmentId: req.establishment.id
        },
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
