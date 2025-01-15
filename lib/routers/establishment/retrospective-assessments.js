const { Router } = require('express');
const { permissions, fetchOpenTasks } = require('../../middleware');
const shasum = require('shasum');
const { BadRequestError, NotFoundError } = require('../../errors');
const { getReasons } = require('../../helpers/retrospective-assessment');
const { isEmpty } = require('lodash');

const submit = action => (req, res, next) => {
  const params = {
    model: 'retrospectiveAssessment',
    meta: req.body.meta,
    data: req.body.data
  };

  return Promise.resolve()
    .then(() => req.workflow.update({
      ...params,
      id: req.params.raId,
      action: req.params.action || action
    }))
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
};

const app = Router({ mergeParams: true });

app.param('raId', (req, res, next, raId) => {
  if (raId === 'reasons') {
    return next('route');
  }
  const { RetrospectiveAssessment } = req.models;
  const { withDeleted } = req.query;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';
  return Promise.resolve()
    .then(() => RetrospectiveAssessment[queryType]().findById(raId))
    .then(ra => {
      if (!ra) {
        throw new NotFoundError();
      }
      req.ra = ra;
      req.ra.project = req.project;
      next();
    })
    .catch(next);
});

const canUpdate = (req, res, next) => {
  if (req.ra.status !== 'draft') {
    return next(new BadRequestError());
  }
  return next();
};

const validateAction = (req, res, next) => {
  const allowed = ['update', 'patch'];

  if (allowed.includes(req.params.action)) {
    return next();
  }
  return next(new BadRequestError());
};

const calculateRaReasons = (req, res, next) => {
  return Promise.resolve()
    .then(() => {
      const { ProjectVersion } = req.models;
      return ProjectVersion.query()
        .where({ projectId: req.project.id, status: 'granted' })
        .orderBy('createdAt', 'desc')
        .then(versions => {
          let reasons;
          return versions.find(v => {
            reasons = getReasons(v.data);
            return !isEmpty(reasons);
          }) ? reasons : {};
        });
    })
    .then(reasons => {
      req.raReasons = reasons;
      next();
    })
    .catch(next);
};

app.put('/:raId/:action',
  permissions('retrospectiveAssessment.update'),
  validateAction,
  canUpdate,
  submit(),
  (req, res, next) => {
    const { RetrospectiveAssessment } = req.models;
    RetrospectiveAssessment.query()
      .withGraphFetched('[project, project.licenceHolder]')
      .findById(req.ra.id)
      .then(ra => {
        res.response = ra;
        res.meta.checksum = shasum(res.response.data);
      })
      .then(() => next())
      .catch(e => next(e));
  }
);

app.get('/reasons',
  permissions('retrospectiveAssessment.read'),
  calculateRaReasons,
  (req, res, next) => {
    res.response = req.raReasons;
    next();
  }
);

app.get('/:raId',
  permissions('retrospectiveAssessment.read'),
  (req, res, next) => {
    res.response = {
      ...req.ra,
      reasons: req.raReasons
    };
    next();
  },
  fetchOpenTasks(req => req.ra.projectId)
);

module.exports = app;
