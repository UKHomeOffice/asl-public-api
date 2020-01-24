const { pick } = require('lodash');
const { Router } = require('express');
const { NotFoundError } = require('@asl/service/errors');
const { permissions } = require('../../middleware');
const { fees } = require('@asl/constants');

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
  pil.profile = pick(pil.profile, 'id', 'firstName', 'lastName', 'establishments');
  pil.establishmentId = id;
  pil.waived = !!pil.waived;
  return pick(pil, 'id', 'establishmentId', 'licenceNumber', 'profile', 'startDate', 'endDate', 'waived');
};

router.use(permissions('establishment.licenceFees'));

router.use((req, res, next) => {
  let year = req.query.year;
  if (!year) {
    year = Object.keys(fees).pop();
    res.meta.year = year;
    res.response = {};
    return next('router');
  }
  if (!fees[year]) {
    return next(new NotFoundError());
  }

  year = parseInt(year, 10);
  const start = `${year}-04-06`;
  const end = `${year + 1}-04-05`;
  req.fees = fees[year];
  res.meta.startDate = start;
  res.meta.endDate = end;
  res.meta.year = year;
  res.meta.years = Object.keys(fees);
  next();
});

router.get('/', (req, res, next) => {
  const { PIL } = req.models;

  const params = {
    establishmentId: req.establishment.id,
    start: res.meta.startDate,
    end: res.meta.endDate
  };

  const establishmentIsBillable = (req.establishment.issueDate && req.establishment.issueDate < params.end) &&
    (!req.establishment.revocationDate || req.establishment.revocationDate > params.start);

  Promise.resolve()
    .then(() => {
      return PIL.query()
        .whereBillable(params)
        .whereNotWaived()
        .count();
    })
    .then(result => {
      const count = parseInt(result[0].count, 10);
      res.response = {};
      res.response.fees = req.fees;
      res.response.numberOfPils = count;
      res.response.pils = req.fees.pil * count;
      res.response.pel = establishmentIsBillable ? req.fees.pel : 0;
      res.response.total = res.response.pils + res.response.pel;
    })
    .then(() => next())
    .catch(next);
});

router.get('/pils', (req, res, next) => {
  const { limit, offset, filter, sort = {} } = req.query;
  sort.column = sort.column || 'profile.lastName';
  const { PIL } = req.models;
  const start = res.meta.startDate;
  const end = res.meta.endDate;

  const params = {
    establishmentId: req.establishment.id,
    start,
    end
  };

  Promise.resolve()
    .then(() => {
      let query = PIL.query().billable(params);
      if (filter) {
        query = query.andWhere(builder => {
          builder
            .where('profile.lastName', 'ilike', `%${filter}%`)
            .orWhere('profile.firstName', 'ilike', `%${filter}%`);
        });
      }
      query = PIL.orderBy({ query, sort });
      query = PIL.paginate({ query, limit, offset });
      return query;
    })
    .then(pils => {
      res.meta.count = pils.total;
      res.meta.total = pils.total;
      res.response = pils.results
        .map(populateDates(req.establishment.id, start, end))
        .map(cleanSensitiveData(req.establishment.id));
    })
    .then(() => next())
    .catch(next);
});

module.exports = router;
