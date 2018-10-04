const { NotFoundError } = require('../../../../errors');
// const permissions = require('../../../../middleware/permissions');
const isUUID = require('uuid-validate');
const { Router } = require('express');

const router = Router({ mergeParams: true });

// const submit = require('./submit');
// const validate = require('./validate');

router.param('pil', (req, res, next, id) => {
  if (!isUUID(id)) {
    return next(new NotFoundError());
  }

  const { PIL } = req.models;

  Promise.resolve()
    .then(() => {
      return PIL.query().findOne({ id, profile_id: res.profile.id });
    })
    .then(pil => {
      if (!pil) {
        throw new NotFoundError();
      }
      res.pil = pil;
      next();
    })
    .catch(next);
});

router.get('/:pil', (req, res, next) => {
  res.response = res.pil;
  next();
});

// router.post('/',
//   permissions('pil.create'),
//   validate,
//   submit('create')
// );

// router.put('/:pil',
//   permissions('pil.update'),
//   validate,
//   submit('update')
// );

// router.delete('/:id', permissions('pil.delete'), submit('delete'));

module.exports = router;
