const { Router } = require('express');
const moment = require('moment');
const { permissions } = require('../../middleware');

const app = Router({ mergeParams: true });

app.get('/', permissions('pil.list'), (req, res, next) => {
  const { PIL } = req.models;

  function getPILCountWhere(where) {
    return PIL.query()
      .where('establishmentId', req.establishment.id)
      .where(where)
      .where({ status: 'active' })
      .count()
      .first()
      .then(result => parseInt(result.count, 10));
  }

  Promise.all([
    getPILCountWhere(builder => builder.where('reviewDate', '<=', moment())),
    getPILCountWhere(builder => {
      builder
        .where('reviewDate', '<=', moment().add(2, 'months'))
        .where('reviewDate', '>', moment());
    })
  ])
    .then(results => {
      res.response = {
        overdue: results[0],
        due: results[1]
      };
    })
    .then(() => next())
    .catch(next);
});

module.exports = app;
