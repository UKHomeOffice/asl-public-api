const { Router } = require('express');
const moment = require('moment');
const { permissions } = require('../../middleware');
const { attachReviewDue } = require('../../helpers/pils');

const router = Router({ mergeParams: true });

router.get('/reviews',
  permissions('pil.list'),
  async (req, res, next) => {
    const { PIL } = await req.models;
    const { status } = await req.query;

    const where = status === 'overdue'
      ? builder => builder.where('reviewDate', '<', moment())
      : builder => builder.whereBetween('reviewDate', [moment(), moment().add(2, 'months')]);

    const query = await PIL.query()
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
  async (req, res, next) => {
    try {
      const { PIL } = await req.models;
      const { search = '', sort = 'asc', limit = 10, offset = 0 } = await req.query;

      // Convert limit and offset to numbers
      const numericLimit = parseInt(limit, 10) || 10;
      const numericOffset = parseInt(offset, 10) || 0;

      const establishmentId = req.establishment.id; // Ensure this is retrieved correctly

      const total = await PIL.count(establishmentId);
      const pils = await PIL.filter({
        search,
        sort,
        limit: numericLimit,
        offset: numericOffset,
        establishmentId
      });

      res.meta = {
        total,
        count: pils.total
      };
      res.response = pils.results.map(pil => attachReviewDue(pil, 2, 'months'));

      next();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
