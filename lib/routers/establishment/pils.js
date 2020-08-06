const { Router } = require('express');
const moment = require('moment');
const { permissions } = require('../../middleware');
const { attachReviewDue } = require('../../helpers/pils');

const router = Router({ mergeParams: true });

router.get('/reviews',
  permissions('pil.list'),
  (req, res, next) => {
    const { PIL } = req.models;
    const { status } = req.query;

    const where = status === 'overdue'
      ? builder => builder.where('reviewDate', '<', moment())
      : builder => builder.whereBetween('reviewDate', [moment(), moment().add(2, 'months')]);

    const query = PIL.query()
      .where('establishmentId', req.establishment.id)
      .where(where)
      .where({ status: 'active' });

    Promise.all([
      query
        .count()
        .first()
        .then(result => parseInt(result.count), 10),
      query
    ])
      .then(([count, results]) => {
        res.response = results;
        res.meta.count = count;
      })
      .then(() => next())
      .catch(next);
  }
);

router.get('/',
  permissions('pil.list'),
  (req, res, next) => {
    const { PIL } = req.models;
    const { search, sort, limit, offset } = req.query;

    Promise.all([
      PIL.count(req.establishment.id),
      PIL.filter({
        search,
        sort,
        limit,
        offset,
        establishmentId: req.establishment.id
      })
    ])
      .then(([total, pils]) => {
        res.meta.total = total;
        res.meta.count = pils.total;
        res.response = pils.results.map(pil => attachReviewDue(pil, 2, 'months'));
        next();
      })
      .catch(next);
  }
);

module.exports = router;
