const { pick } = require('lodash');
const { Router } = require('express');
const { permissions } = require('../../middleware');
const { NotFoundError } = require('@asl/service/errors');

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
  return pick(pil, 'id', 'establishmentId', 'licenceNumber', 'profile', 'startDate', 'endDate');
};

const fees = {
  2017: {
    pel: 500,
    pil: 250
  },
  2018: {
    pel: 550,
    pil: 275
  },
  2019: {
    pel: 600,
    pil: 300
  }
};

router.use(permissions('establishment.licenceFees'));

router.use((req, res, next) => {
  let year = req.query.year;
  if (!year) {
    year = Object.keys(fees).pop();
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
  res.meta.years = Object.keys(fees).map(y => parseInt(y, 10));
  next();
});

router.get('/', (req, res, next) => {
  const { PIL } = req.models;

  const params = {
    establishmentId: req.establishment.id,
    start: res.meta.startDate,
    end: res.meta.endDate
  };
  Promise.resolve()
    .then(() => PIL.query().whereBillable(params).count())
    .then(result => {
      const count = parseInt(result[0].count, 10);
      res.response = {};
      res.response.fees = req.fees;
      res.response.numberOfPils = count;
      res.response.pils = req.fees.pil * count;
      res.response.pel = req.fees.pel;
      res.response.total = res.response.pils + res.response.pel;
    })
    .then(() => next())
    .catch(next);
});

router.get('/pils', (req, res, next) => {
  const { limit, offset, sort = {} } = req.query;
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
