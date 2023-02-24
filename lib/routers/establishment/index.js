const { Router } = require('express');
const { NotFoundError } = require('../../errors');
const { fetchOpenTasks, permissions, validateSchema, whitelist, updateDataAndStatus, fetchReminders } = require('../../middleware');
const profileRouter = require('../profile');
const { omit } = require('lodash');

const submit = action => (req, res, next) => {
  const params = {
    model: 'establishment',
    meta: req.body.meta,
    data: {
      ...(req.body.data || req.body)
    },
    id: req.establishment.id,
    action
  };

  return Promise.resolve()
    .then(() => req.workflow.update(params))
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

const validateEstablishment = (req, res, next) => {
  return validateSchema(req.models.Establishment, {
    ...omit(req.body.data, 'corporateStatus', 'legalName', 'legalPhone', 'legalEmail', 'nprc', 'pelh'),
    id: req.establishment.id
  })(req, res, next);
};

module.exports = (settings) => {
  const router = Router({ mergeParams: true });

  router.param('establishment', (req, res, next, id) => {
    const { Establishment } = req.models;

    if (isNaN(parseInt(id, 10))) {
      throw new NotFoundError();
    }

    return Promise.resolve()
      .then(() => Establishment.query().findById(id))
      .then(establishment => {
        if (!establishment) {
          throw new NotFoundError();
        }
        req.establishment = establishment;
        next();
      })
      .catch(next);
  });

  router.get('/', permissions('establishment.list'), (req, res, next) => {
    let { limit, offset } = req.query;
    const { Establishment } = req.models;
    Promise.all([
      Establishment.count(),
      Establishment.paginate({
        query: Establishment.query(),
        limit,
        offset
      })
    ])
      .then(([total, establishments]) => {
        res.meta.total = total;
        res.meta.count = establishments.total;
        res.response = establishments.results;
        return next();
      })
      .catch(next);
  });

  router.use('/:establishment', permissions('establishment.read'));

  router.get('/:establishment', (req, res, next) => {
    const { Establishment, PIL, Project } = req.models;

    Promise.resolve()
      .then(() => {
        const query = Establishment.query()
          .select('establishments.*')
          .count('places.id', {as: 'placesCount'})
          .leftJoin('places', 'places.establishment_id', 'establishments.id')
          .findById(req.establishment.id)
          .withGraphFetched('[authorisations]')
          .groupBy('establishments.id');

        const activePilsQuery = PIL.query()
          .count('pils.id')
          .where('status', 'active')
          .andWhere('establishmentId', req.establishment.id)
          .as('activePilsCount');

        const activeProjectsQuery = Project.query()
          .count('projects.id')
          .where('status', 'active')
          .andWhere(builder => {
            builder
              .where('establishmentId', req.establishment.id)
              .orWhere(b => b.whereHasAdditionalAvailability(req.establishment.id));
          })
          .as('activeProjectsCount');

        query.select(activePilsQuery, activeProjectsQuery);

        return query;
      })
      .then(result => {
        req.establishment = result;
        res.response = req.establishment;
      })
      .then(() => next())
      .catch(next);

  }, fetchOpenTasks(), fetchReminders('establishment'));

  router.get('/:establishment/named-people', (req, res, next) => {
    const { Role } = req.models;
    Promise.resolve()
      .then(() => {
        return Role.query()
          .where('establishmentId', req.establishment.id)
          .withGraphFetched('profile');
      })
      .then(result => {
        res.response = result;
        next();
      })
      .catch(next);
  });

  router.put('/:establishment',
    permissions('establishment.update'),
    whitelist('name', 'address', 'country', 'procedure', 'breeding', 'supplying', 'authorisations', 'isTrainingEstablishment', 'corporateStatus', 'legalName', 'legalPhone', 'legalEmail', 'nprc', 'pelh'),
    validateEstablishment,
    updateDataAndStatus(),
    submit('update')
  );

  router.put('/:establishment/grant',
    permissions('establishment.update'),
    whitelist(),
    submit('grant')
  );

  router.use('/:establishment/role(s)?', require('./roles'));
  router.use('/:establishment/place(s)?', require('./places'));
  router.use('/:establishment/profile(s)?', profileRouter(settings));
  router.use('/:establishment/project(s)?', require('./projects'));
  router.use('/:establishment/invite-user', require('./invite-user'));
  router.use('/:establishment/invitations', require('./invitations'));
  router.use('/:establishment/pils', require('./pils'));
  router.use('/:establishment/billing', require('./billing'));
  router.use('/:establishment/rops', require('./rops-overview'));
  router.use('/:establishment/training-course(s)?', require('./training-courses'));

  return router;
};
