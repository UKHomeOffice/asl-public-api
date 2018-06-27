const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Role, PIL, Project } = req.models;
  Promise.resolve()
    .then(() => {
      return req.establishment.getProfiles({
        where: req.where,
        include: [ Role, PIL, Project ],
        order: [['lastName', 'ASC'], ['firstName', 'ASC']]
      });
    })
    .then(profiles => {
      res.response = profiles;
      next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const { Role, Place, Profile, PIL, Project } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.findOne({
        where: {
          id: req.params.id,
          establishmentId: req.establishment.id
        },
        include: [
          {
            model: Role,
            include: {
              model: Place
            }
          },
          PIL,
          Project
        ]
      });
    })
    .then(profile => {
      res.response = profile;
      next();
    })
    .catch(next);
});

module.exports = router;
