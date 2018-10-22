const { Router } = require('express');
const router = Router({ mergeParams: true });

const getPILTasks = req => {
  const { PIL } = req.models;
  const profile = req.profile;

  return Promise.resolve()
    .then(() => {
      // fetch all the pils relevant to this user
      const pils = profile.establishments.map(establishment => {
        return Promise.resolve()
          .then(() => req.user.can('pil.read.all', { establishmentId: establishment.id }))
          .then(allowed => {
            console.log('allowed: ', allowed);
            if (allowed) {
              return PIL.query()
                .whereIn('status', ['pending', 'expired', 'revoked'])
                .andWhere('establishmentId', establishment.id);
            }

            return PIL.query()
              .whereIn('status', ['pending', 'expired', 'revoked'])
              .andWhere('profileId', profile.id);
          });
      });

      return Promise.all(pils);
    })
    .then(pils => {
      // turn the pils into tasks
      console.log(pils);
      return pils.map(pil => {
        return {
          received: pil.updatedAt,
          establishment: profile.establishments[pil.establishmentId],
          licence: 'PIL',
          type: 'PIL application',
          pil
        };
      });
    });
};

router.use('/', (req, res, next) => {
  const tasks = [];

  return Promise.resolve()
    .then(() => tasks.push(getPILTasks(req)))
    .then(() => {
      res.response = tasks;
      next();
    })
    .catch(next);
});

module.exports = router;
