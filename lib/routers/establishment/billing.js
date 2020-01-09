const { pick } = require('lodash');
const { permissions } = require('../../middleware');
const { Router } = require('express');

const router = Router({ mergeParams: true });

const populateDates = (id, start, end) => pil => {
  pil.startDate = pil.pilTransfers
    .filter(t => t.toEstablishmentId === id)
    .reduce((date, t) => {
      return (t.createdAt > date && t.createdAt < end) ? t.createdAt : date;
    }, pil.issueDate);

  pil.endDate = pil.pilTransfers
    .filter(t => t.fromEstablishmentId === id)
    .reduce((date, t) => {
      return ((!date || t.createdAt > date) && t.createdAt > pil.startDate) ? t.createdAt : date;
    }, null) || pil.revocationDate;

  return pil;
};

const cleanSensitiveData = (id) => pil => {
  pil.profile.establishments = pil.profile.establishments.filter(e => e.id === id);
  pil.profile = pick(pil.profile, 'id', 'firstName', 'lastName', 'establishments');
  pil.establishmentId = id;
  return pick(pil, 'id', 'establishmentId', 'licenceNumber', 'profile', 'startDate', 'endDate');
};

router.get('/',
  permissions('establishment.licenceFees'),
  (req, res, next) => {
    const { limit, offset, sort = {} } = req.query;
    const { PIL } = req.models;

    const year = parseInt(req.query.year, 10);
    const start = `${year}-04-06`;
    const end = `${year + 1}-04-05`;

    const params = {
      establishmentId: req.establishment.id,
      start,
      end
    };
    let query = PIL.query().billable(params);
    query = PIL.orderBy({ query, sort: { ...sort, column: sort.column || 'profile.lastName' } });
    Promise.resolve()
      .then(() => PIL.paginate({ query, limit, offset }))
      .then(pils => {
        res.meta.count = pils.total;
        res.meta.total = pils.total;
        res.meta.startDate = start;
        res.meta.endDate = end;
        res.response = pils.results
          .map(populateDates(req.establishment.id, start, end))
          .map(cleanSensitiveData(req.establishment.id));
      })
      .then(() => next('router'))
      .catch(next);
  }
);

module.exports = router;
