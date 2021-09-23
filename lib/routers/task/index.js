const { Router } = require('express');
const { get, some } = require('lodash');
const isUUID = require('uuid-validate');
const { NotFoundError, UnauthorisedError, BadRequestError } = require('../../errors');
const router = Router({ mergeParams: true });

router.get('/related', (req, res, next) => {
  return req.workflow.related({ query: req.query })
    .then(response => {
      res.response = response.json.data;
      res.meta = response.json.meta;
      // don't fall through to the routes below as they will capture 'related' as ':taskId'
      return next('router');
    })
    .catch(next);
});

router.param('taskId', (req, res, next, taskId) => {
  if (!isUUID(taskId)) {
    throw new NotFoundError();
  }
  req.taskId = taskId;
  return req.workflow.task(req.taskId).read()
    .then(response => {
      const task = response.json.data;
      if (!task) {
        throw new NotFoundError();
      }
      req.task = task;
      next();
    })
    .catch(next);
});

router.use('/:taskId', async (req, res, next) => {
  const model = req.task.data.model;
  let perm = '';
  const params = {
    id: req.task.data.id,
    establishment: req.task.data.establishmentId
  };

  if (model === 'project') {
    const versionId = get(req.task, 'data.data.version');
    if (versionId) {
      perm = 'projectVersion.read';
      params.versionId = versionId;
      params.projectId = params.id;
    } else {
      perm = 'project.read.single';
    }
  } else if (model === 'role') {
    perm = 'establishment.read';
  } else if (model === 'rop') {
    perm = 'project.read.single';
    params.projectId = get(req.task, 'data.data.projectId');
  } else if (model === 'profile') {
    perm = 'profile.global';
  } else if (model === 'pil') {
    perm = 'pil.read';
    const action = get(req.task, 'data.action');

    if (action === 'transfer') {
      const estTo = get(req.task, 'data.data.establishment.to.id');
      const estFrom = get(req.task, 'data.data.establishment.from.id');

      return Promise.all([
        req.user.can(perm, { ...params, establishment: estTo }),
        req.user.can(perm, { ...params, establishment: estFrom })
      ])
        .then(some).then(allowed => {
          if (allowed) {
            return next();
          }
          throw new UnauthorisedError();
        });
    }

  } else if (model === 'trainingPil') {
    perm = 'pil.read';
    const trainingCourseId = get(req.task, 'data.data.trainingCourseId');
    const trainingCourse = await req.models.TrainingCourse.query().findById(trainingCourseId);

    if (!trainingCourse) {
      return next(new Error('No associated training course found for personal licence'));
    }

    if (params.establishment !== trainingCourse.establishmentId) {
      // if trainingCourse is at a different establishment from pil,
      // check the user has pil read permissions at either establishment.
      return Promise.all([
        req.user.can(perm, params),
        req.user.can(perm, { ...params, establishment: trainingCourse.establishmentId })
      ]).then(some).then(allowed => {
        if (allowed) {
          return next();
        }
        throw new UnauthorisedError();
      });
    }

  } else {
    perm = `${model}.read`;
  }

  req.user.can(perm, params)
    .then(allowed => {
      if (allowed) {
        return next();
      }
      throw new UnauthorisedError();
    })
    .catch(next);
});

router.get('/:taskId', (req, res, next) => {
  res.response = req.task;
  next();
});

router.put('/:taskId/status', async (req, res, next) => {
  const { status } = req.body.data;
  const { ProjectVersion } = req.models;

  if (status !== 'recovered') {
    return next();
  }

  const can = await req.user.can('project.recoverTask');

  if (!can) {
    return next(new UnauthorisedError('Only ASRU Admin users can recover tasks'));
  }

  const response = await req.workflow.task(req.taskId).read();
  const task = response.json.data;

  if (task.data.model !== 'project') {
    return next(new BadRequestError('Can only recover project tasks'));
  }

  if (task.data.action !== 'grant') {
    return next(new BadRequestError('Can only recover grant tasks'));
  }

  const version = await ProjectVersion.query().where({ projectId: task.data.id }).orderBy('createdAt', 'DESC').first();

  if (!version) {
    return next(new NotFoundError());
  }

  if (version.id !== task.data.data.version) {
    return next(new BadRequestError('Task cannot be recovered - version has been amended.'));
  }

  next();
});

router.put('/:taskId/status', (req, res, next) => {
  return req.workflow.task(req.taskId).status({
    status: req.body.data.status,
    meta: req.body.meta
  })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

router.post('/:taskId/comment', (req, res, next) => {
  return req.workflow.task(req.taskId).comment({ comment: req.body.comment, meta: req.body.meta })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
});

router.put('/:taskId/comment/:commentId', (req, res, next) => {
  return req.workflow.task(req.taskId).updateComment({ id: req.params.commentId, comment: req.body.comment, meta: req.body.meta })
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

router.delete('/:taskId/comment/:commentId', (req, res, next) => {
  return req.workflow.task(req.taskId).deleteComment({ id: req.params.commentId })
    .then(response => {
      res.response = response;
      next();
    })
    .catch(next);
});

router.get('/', (req, res, next) => {
  return req.workflow.list({ query: req.query })
    .then(response => {
      res.meta = response.json.meta;
      res.response = response.json.data;
      next();
    })
    .catch(next);
});

module.exports = router;
