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
  const { Establishment, Role, Place, Profile, PIL, Project, TrainingModule } = req.models;
  Promise.resolve()
    .then(() => {
      return Profile.findOne({
        where: {
          id: req.params.id
        },
        include: [
          {
            model: Establishment,
            where: {
              id: req.establishment.id
            }
          },
          {
            model: Role,
            include: {
              model: Place,
              required: false
            }
          },
          PIL,
          Project,
          TrainingModule
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
