const { get, some, omit } = require('lodash');
const moment = require('moment');
const { ref } = require('objection');
const { Router } = require('express');
const { BadRequestError, NotFoundError } = require('../../errors');
const { fetchOpenTasks, fetchReminders, permissions, whitelist, updateDataAndStatus } = require('../../middleware');

const router = Router({ mergeParams: true });

const submit = action => (req, res, next) => {
  const params = {
    establishmentId: req.establishment.id,
    data: {
      establishmentId: req.establishment.id,
      ...req.body.data,
      licenceHolderId: req.project
        ? req.project.licenceHolderId
        : req.user.profile.id
    },
    model: 'project',
    meta: req.body.meta || {
      changedBy: req.user.profile.id
    }
  };

  return Promise.resolve()
    .then(() => {
      switch (action) {
        case 'create':
          return req.workflow.create({
            ...params,
            data: {
              ...params.data,
              licenceHolderId: get(req.body, 'data.licenceHolderId', req.user.profile.id)
            }
          });
        case 'delete':
          return req.workflow.delete({
            ...params,
            id: req.project.id
          });
        case 'delete-amendments':
          return req.workflow.update({
            ...params,
            id: req.project.id,
            action: 'delete-amendments'
          });
        case 'update':
          return req.workflow.update({
            ...params,
            data: {
              ...params.data,
              ...req.body.data
            },
            id: req.project.id
          });
        case 'fork':
          return req.workflow.update({
            ...params,
            action: 'fork',
            id: req.project.id
          });
        case 'fork-ra':
          return req.workflow.update({
            ...params,
            action: 'fork-ra',
            id: req.project.id
          });
        case 'revoke':
          return req.workflow.update({
            ...params,
            action: 'revoke',
            id: req.project.id
          });
        case 'transfer-draft':
          return req.workflow.update({
            id: req.project.id,
            model: 'project',
            action: 'transfer-draft',
            data: {
              establishmentId: get(req.body, 'data.targetEstablishmentId')
            }
          });
        default:
          return req.workflow.update({
            ...params,
            action,
            id: req.project.id
          });
      }
    })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

const loadRa = (req, res, next) => {
  const { RetrospectiveAssessment } = req.models;
  return Promise.resolve()
    .then(() => RetrospectiveAssessment.query()
      .select('id', 'status', 'createdAt', 'updatedAt')
      .where({ projectId: req.project.id })
      .orderBy('createdAt', 'desc')
    )
    .then(ras => {
      const draft = ras && ras[0] && ras[0].status === 'draft' ? ras[0] : undefined;
      // get most recent granted version.
      const granted = ras.find(v => v.status === 'granted');
      req.project = {
        ...req.project,
        grantedRa: granted,
        draftRa: draft
      };
    })
    .then(() => next())
    .catch(next);
};

const loadVersions = (req, res, next) => {

  const { ProjectVersion } = req.models;
  const { withDeleted } = req.query;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';
  return ProjectVersion[queryType]()
    .select('id', 'status', 'createdAt', 'asruVersion', 'updatedAt')
    .select(ref('data:isLegacyStub').as('isLegacyStub'))
    .select(ref('data:duration').as('duration'))
    .where({ projectId: req.project.id })
    .withGraphFetched(`[licenceHolder(constrainLicenceHolderParams).establishments(constrainEstablishmentParams)]`)
    .modifiers({
      constrainLicenceHolderParams: builder => builder.select('id', 'firstName', 'lastName'),
      constrainEstablishmentParams: builder => builder.select('id', 'name', 'licenceNumber', 'address', 'suspendedDate')
    })
    .orderBy('createdAt', 'desc')
    .then(versions => {
      // if most recent version is a draft, include this.
      const draft = versions && versions[0] && versions[0].status === 'draft' ? versions[0] : undefined;
      const withdrawn = versions && versions[0] && versions[0].status === 'withdrawn' ? versions[0] : undefined;
      // get most recent granted version.
      const granted = versions.find(v => v.status === 'granted');
      req.project = {
        ...req.project,
        granted,
        draft,
        withdrawn,
        versions
      };
      next();
    });
};

router.get('/', (req, res, next) => {
  const { Project } = req.models;
  const { limit, offset, search, filters, sort, status = 'active' } = req.query;

  const projects = Project.scopeToParams({
    licenceHolderId: req.user.profile.id,
    establishmentId: req.establishment.id,
    status,
    search,
    filters,
    offset,
    limit,
    sort,
    isAsru: req.user.profile.asruUser
  });

  Promise.resolve()
    .then(() => req.user.can('project.read.all', req.params))
    .then(allowed => {
      if (allowed) {
        return projects.getAll();
      }
      return Promise.resolve()
        .then(() => req.user.can('project.read.basic', req.params))
        .then(allowed => {
          if (allowed) {
            return projects.getOwn();
          }
          throw new NotFoundError();
        });
    })
    .then(({ total, projects }) => {
      res.meta.count = projects.total;
      res.meta.total = total;
      res.response = projects.results;
      next();
    })
    .catch(next);
});

router.param('projectId', (req, res, next, projectId) => {
  if (projectId === 'ras-due') {
    return next('route');
  }
  const { Project } = req.models;
  const { withDeleted } = req.query;
  const queryType = withDeleted ? 'queryWithDeleted' : 'query';
  // TODO: make this configurable
  const year = 2021;

  Promise.resolve()
    .then(() => {
      return Project[queryType]()
        .select('projects.*')
        .selectRopsDeadline(year)
        .findById(projectId)
        .leftJoinRelation('additionalEstablishments')
        .where(builder => {
          builder
            .where('projects.establishmentId', req.establishment.id)
            .orWhere('additionalEstablishments.id', req.establishment.id);
        })
        .withGraphFetched(`[
          licenceHolder(constrainParams),
          collaborators(constrainCollabParams).establishments,
          establishment(constrainEstablishmentParams),
          additionalEstablishments(constrainAdditionalEstablishmentParams),
          rops(constrainRopParams),
          retrospectiveAssessments
        ]`)
        .modifiers({
          constrainParams: builder => builder.select('firstName', 'lastName', 'id', 'email'),
          constrainCollabParams: builder => builder.select('firstName', 'lastName', 'id', 'email', 'role'),
          constrainEstablishmentParams: builder => builder.select('id', 'name', 'suspendedDate'),
          constrainAdditionalEstablishmentParams: builder => builder.select('id', 'name', 'projectEstablishments.status', 'projectEstablishments.versionId', 'projectEstablishments.issueDate', 'projectEstablishments.revokedDate', 'suspendedDate'),
          constrainRopParams: builder => builder.select('id', 'year', 'status', 'submittedDate')
        });
    })
    .then(async project => {
      if (!project) {
        throw new NotFoundError();
      }
      project.collaborators = project.collaborators.filter(c => c.establishments.map(e => e.id).includes(req.establishment.id));

      const establishmentForUser = establishment => {
        return req.user.can('establishment.read', {establishment: establishment.id})
          .then(canReadEstablishment => {
            if (canReadEstablishment) {
              return establishment;
            }
            return omit(establishment, ['suspendedDate']);
          });
      };
      project.establishment = await Promise.resolve(establishmentForUser(project.establishment));
      project.additionalEstablishments = await Promise.all(project.additionalEstablishments.map(establishmentForUser));

      req.project = project;
      next();
    })
    .catch(next);
});

const canFork = (req, res, next) => {
  const version = get(req.project, 'versions[0]');
  if (!version) {
    return next(new NotFoundError());
  }
  // version can be forked, continue
  if (version.status !== 'draft') {
    return next();
  }
  // version cannot be forked, get version id
  res.response = {
    data: {
      id: version.id
    }
  };
  return next('route');
};

const canRevoke = (req, res, next) => {
  if (req.project.status !== 'active') {
    return next(new BadRequestError('only active projects can be revoked'));
  }
  return next();
};

const canDelete = (req, res, next) => {
  if (req.project.status !== 'inactive') {
    return next(new BadRequestError('Active projects cannot be deleted.'));
  }
  next();
};

const canDeleteAmendments = (req, res, next) => {
  const granted = req.project.versions.find(v => v.status === 'granted');
  const recentDrafts = req.project.versions.filter(v => v.status !== 'granted' && v.createdAt > granted.createdAt);
  const versionTypeMismatch = some(recentDrafts, draft => draft.asruVersion !== req.user.profile.asruUser);
  if (versionTypeMismatch) {
    return next(new BadRequestError(`Cannot delete amendment as initiated by ${req.user.profile.asruUser ? 'the Establishment' : 'ASRU'}`));
  }
  return next();
};

const canTransferDraft = (req, res, next) => {
  if (req.project.status !== 'inactive') {
    return next(new BadRequestError('Cannot transfer a non-draft project'));
  }

  if (res.meta.openTasks.length > 0) {
    return next(new BadRequestError('Cannot transfer a draft project which has an open task'));
  }

  const targetEstablishmentId = get(req.body, 'data.targetEstablishmentId');
  if (!targetEstablishmentId) {
    return next(new BadRequestError(`'targetEstablishmentId' must be provided`));
  }

  if (!(req.user.profile.establishments || []).find(e => e.id === targetEstablishmentId)) {
    return next(new BadRequestError('can only transfer a draft to establishments the user is associated with'));
  }

  if (req.project.establishmentId === targetEstablishmentId) {
    return next(new BadRequestError('cannot transfer a draft to the same establishment'));
  }

  return next();
};

const refreshProject = (req, res, next) => {
  return Promise.resolve()
    .then(() => req.models.Project.query().findById(req.project.id))
    .then(project => {
      res.response = project;
    })
    .then(() => next())
    .catch(next);
};

router.get('/ras-due',
  (req, res, next) => {
    const { Project } = req.models;

    const query = Project.query()
      .where({ establishmentId: req.establishment.id })
      .where('raDate', '<=', moment().add(1, 'month').toISOString())
      .whereNull('raGrantedDate');

    Promise.all([
      query
        .count()
        .first()
        .then(result => result.count),
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

router.use('/:projectId', loadVersions, loadRa);

router.get('/:projectId',
  permissions('project.read.single'),
  (req, res, next) => {
    res.response = req.project;
    next();
  },
  fetchReminders('project'),
  fetchOpenTasks()
);

router.post('/',
  permissions('project.create', req => (
    { profileId: get(req.body, 'data.licenceHolderId', req.user.profile.id) }
  )),
  whitelist('version', 'licenceHolderId'),
  submit('create')
);

router.delete('/:projectId',
  permissions('project.delete'),
  canDelete,
  submit('delete')
);

router.delete('/:projectId/draft-amendments',
  permissions('project.update'),
  canDeleteAmendments,
  submit('delete-amendments')
);

router.post('/:projectId/fork',
  permissions('project.update'),
  canFork,
  submit('fork')
);

router.post('/:projectId/fork-ra',
  permissions('project.update'),
  submit('fork-ra')
);

router.put('/:projectId/update-licence-holder',
  permissions('project.update'),
  updateDataAndStatus(),
  submit('update')
);

router.put('/:projectId/transfer-draft',
  permissions('project.transfer'),
  whitelist('targetEstablishmentId'),
  fetchOpenTasks(req => req.project.id),
  canTransferDraft,
  submit('transfer-draft'),
  refreshProject
);

router.put('/:projectId/revoke',
  permissions('project.revoke'),
  canRevoke,
  whitelist('comments'),
  submit('revoke')
);

router.post('/:projectId/grant',
  permissions('project.submit'),
  submit('grant')
);

router.post('/:projectId/grant-ra',
  permissions('retrospectiveAssessment.submit'),
  submit('grant-ra')
);

router.use('/:projectId/collaborators(s)?', require('./project-collaborators'));
router.use('/:projectId/project-version(s)?', require('./project-versions'));
router.use('/:projectId/retrospective-assessment(s)?', require('./retrospective-assessments'));
router.use('/:projectId/rop(s)?', require('./rops'));

module.exports = router;
