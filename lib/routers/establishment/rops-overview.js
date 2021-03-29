const { Router } = require('express');
const { permissions } = require('../../middleware');
const { BadRequestError } = require('../../errors');

const app = Router({ mergeParams: true });

app.use(permissions('establishment.rops'));

app.get('/overview', (req, res, next) => {
  const { Project } = req.models;
  const { ropsYear, establishmentId } = req.query;

  const ropsDueQuery = Project.query()
    .count()
    .whereHasAvailability(establishmentId)
    .whereRopsDue(ropsYear);

  const ropsSubmittedQuery = ropsDueQuery.clone().whereRopsSubmitted(ropsYear);

  return Promise.all([ropsDueQuery, ropsSubmittedQuery])
    .then(([ropsDue, ropsSubmitted]) => {
      const due = parseInt(ropsDue[0].count, 10);
      const submitted = parseInt(ropsSubmitted[0].count, 10);
      res.response = {
        year: ropsYear,
        establishmentId,
        due,
        submitted,
        outstanding: due - submitted
      };
    })
    .then(() => next())
    .catch(next);
});

app.get('/', (req, res, next) => {
  const { Project } = req.models;
  const { limit, offset, sort, ropsYear, ropsStatus = 'outstanding' } = req.query;

  if (!ropsYear) {
    throw new BadRequestError('ropsYear must be provided');
  }

  return Promise.resolve()
    .then(() => {
      return Project.scopeToParams({
        establishmentId: req.establishment.id,
        offset,
        limit,
        sort,
        status: ['active', 'expired', 'revoked'],
        ropsStatus,
        ropsYear
      }).getAll();
    })
    .then(({ total, projects }) => {
      res.meta.count = projects.total;
      res.meta.total = total;
      res.response = projects.results;
      next();
    })
    .catch(next);
});

module.exports = app;
