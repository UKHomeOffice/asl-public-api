const { pick, omit } = require('lodash');
const { Router } = require('express');
const { NotFoundError } = require('@asl/service/errors');
const { permissions } = require('../../middleware');
const { fees } = require('@ukhomeoffice/asl-constants');
const moment = require('moment');

const pastAndCurrentFees = () => {
  const financialYearStart = moment(`04-06 00:00:00`, 'MM-DD HH:mm:ss');

  let currentFinancialYear = (new Date()).getFullYear();
  if (financialYearStart.isAfter()) {
    currentFinancialYear--;
  }

  return Object.fromEntries(
    Object.entries(fees).filter(([k]) => k <= currentFinancialYear)
  );
};

const getDefaultYear = () => {
  const lastYear = (new Date()).getFullYear() - 1;
  const feesToShow = pastAndCurrentFees();
  if (Object.keys(feesToShow).includes(lastYear.toString())) {
    return lastYear;
  }
  return Object.keys(feesToShow).pop();
};

const router = Router({ mergeParams: true });

const populateDates = (establishmentId, start, end) => profile => {
  const pil = profile.pil;

  if (!pil) {
    const trainingPil = profile.trainingPils.find(p => p.trainingCourse && p.trainingCourse.establishmentId === establishmentId);
    return {
      profile,
      licenceNumber: profile.pilLicenceNumber,
      startDate: trainingPil.issueDate,
      endDate: trainingPil.revocationDate || trainingPil.expiryDate,
      waived: profile.waived
    };
  }

  pil.profile = omit(profile, 'pil');
  pil.waived = profile.waived;
  pil.licenceNumber = profile.pilLicenceNumber;
  pil.startDate = pil.pilTransfers
    .filter(t => t.toEstablishmentId === establishmentId)
    .reduce((date, t) => {
      return (t.createdAt > date && t.createdAt < end) ? t.createdAt : date;
    }, pil.issueDate);

  if (pil.status !== 'active' || pil.establishmentId !== establishmentId) {
    pil.endDate = pil.pilTransfers
      .filter(t => t.fromEstablishmentId === establishmentId)
      .reduce((date, t) => {
        return ((!date || t.createdAt > date) && t.createdAt > pil.startDate) ? t.createdAt : date;
      }, null) || pil.revocationDate;
  }

  return pil;
};

const cleanSensitiveData = (id) => pil => {
  pil.profile = pick(pil.profile, 'id', 'firstName', 'lastName', 'establishments');
  pil.establishmentId = id;
  pil.waived = !!pil.waived;
  return pick(pil, 'id', 'establishmentId', 'licenceNumber', 'profile', 'startDate', 'endDate', 'waived');
};

router.use(permissions('establishment.licenceFees'));

router.get('*', (req, res, next) => {
  let year = req.query.year;
  if (!year) {
    year = getDefaultYear();
    res.meta.year = year;
    res.response = {};
    return next('router');
  }

  const feesToShow = pastAndCurrentFees();
  if (!feesToShow[year]) {
    return next(new NotFoundError());
  }

  year = parseInt(year, 10);
  const start = `${year}-04-06`;
  const end = `${year + 1}-04-05`;

  req.fees = feesToShow[year];
  res.meta.startDate = start;
  res.meta.endDate = end;
  res.meta.year = year;
  res.meta.years = Object.keys(feesToShow);
  next();
});

router.get('/', (req, res, next) => {
  const { Profile } = req.models;

  const params = {
    establishmentId: req.establishment.id,
    start: res.meta.startDate,
    end: res.meta.endDate
  };

  const establishmentIsBillable = (req.establishment.issueDate && req.establishment.issueDate < params.end) &&
    (!req.establishment.revocationDate || req.establishment.revocationDate > params.start);

  Promise.resolve()
    .then(() => {
      return Profile.query()
        .whereHasBillablePIL(params)
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
  sort.column = sort.column || 'lastName';
  const { Profile } = req.models;
  const start = res.meta.startDate;
  const end = res.meta.endDate;
  const year = parseInt(start.substr(0, 4), 10);

  const params = {
    establishmentId: req.establishment.id,
    start,
    end
  };

  Promise.resolve()
    .then(() => req.user.can('pil.updateBillable'))
    .then(canSeeBillable => {
      let query = Profile.query()
        .select(
          'profiles.*',
          Profile.relatedQuery('feeWaivers')
            .where({ establishmentId: params.establishmentId, year })
            .select(1)
            .as('waived')
        )
        .withGraphFetched('[pil.pilTransfers,establishments,trainingPils.trainingCourse]')
        .modifyGraph('establishments', builder => {
          builder.where('id', params.establishmentId);
        })
        .modifyGraph('pil', builder => {
          builder.whereBillable({ establishmentId: params.establishmentId, start, end });
        })
        .modifyGraph('trainingPils.trainingCourse', builder => {
          builder.where('establishmentId', params.establishmentId);
        })
        .whereHasBillablePIL(params);
      if (!canSeeBillable) {
        query.whereNotWaived();
      }
      if (filter) {
        query = query.andWhere(builder => {
          builder
            .whereNameMatch(filter)
            .orWhere('pilLicenceNumber', 'ilike', `%${filter}%`);
        });
      }
      query = Profile.orderBy({ query, sort });
      query = Profile.paginate({ query, limit, offset });
      return query;
    })
    .then(profiles => {
      res.meta.count = profiles.total;
      res.meta.total = profiles.total;
      res.response = profiles.results
        .map(populateDates(req.establishment.id, start, end))
        .map(cleanSensitiveData(req.establishment.id));
    })
    .then(() => next())
    .catch(next);
});

router.put('/', (req, res, next) => {
  const params = {
    model: 'establishment',
    data: req.body.data,
    id: req.establishment.id,
    action: 'update-billing'
  };

  return Promise.resolve()
    .then(() => req.workflow.update(params))
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
});

module.exports = router;
