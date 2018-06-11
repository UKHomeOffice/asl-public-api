const { Router } = require('express');

const router = Router({ mergeParams: true });

router.get('/', (req, res, next) => {
  const { Profile } = req.models;
  Promise.resolve()
    .then(() => {
      return req.establishment.getProjects({
        where: req.where,
        include: {
          model: Profile,
          as: 'licenceHolder'
        }
      });
    })
    .then(projects => {
      res.response = projects;
      next();
    })
    .catch(next);
});

router.get('/:id', (req, res, next) => {
  const { Profile, Project } = req.models;
  Promise.resolve()
    .then(() => {
      return Project.findOne({
        where: {
          id: req.params.id,
          establishmentId: req.establishment.id
        },
        include: {
          model: Profile,
          as: 'licenceHolder'
        }
      });
    })
    .then(project => {
      res.response = project;
      next();
    })
    .catch(next);
});

module.exports = router;
