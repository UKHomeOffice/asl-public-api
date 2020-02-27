const {Router} = require('express');

const router = Router();

router.use('/establishment(s)?/:establishmentId/project(s)?/:projectId/project-version(s)?/:versionId', (req, res, next) => {
  req.user.can('project.read.single', req.params)
    .then(canViewProject => {
      if (canViewProject) {
        return next();
      }
      req.user.can('projectVersion.read', req.params)
        .then(canViewVersion => {
          if (canViewVersion) {
            req.permissionHoles = ['establishment.read', 'project.read'];
          }
          next();
        });
    })
    .catch(next);
});

module.exports = router;
