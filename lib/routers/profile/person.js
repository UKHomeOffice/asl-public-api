const moment = require('moment');
const { Router } = require('express');
const isUUID = require('uuid-validate');
const { get, some } = require('lodash');
const {
  fetchOpenProfileTasks,
  fetchOpenTasks,
  fetchReminders,
  permissions,
  whitelist,
  validateSchema,
  updateDataAndStatus
} = require('../../middleware');
const { attachReviewDue } = require('../../helpers/pils');
const { NotFoundError, BadRequestError } = require('../../errors');
const Keycloak = require('../../helpers/keycloak');

const update = () => (req, res, next) => {
  const params = {
    model: 'profile',
    id: req.profileId,
    data: req.body.data,
    meta: req.body.meta
  };

  req.workflow.update(params)
    .then(response => {
      res.response = response.json.data;
      next();
    })
    .catch(next);
};

const validate = () => {
  return (req, res, next) => {
    return validateSchema(req.models.Profile, {
      ...(req.user.profile || {}),
      ...req.body.data
    })(req, res, next);
  };
};

const validateEmail = () => {
  return (req, res, next) => {
    const email = get(req, 'body.data.email');

    if (!email) {
      throw new BadRequestError('An email address must be provided');
    }

    const { Profile } = req.models;
    return Profile.query().where({ email })
      .then(profiles => {
        if (profiles.length > 0) {
          throw new BadRequestError('Email address is already in use');
        }
      })
      .then(() => next())
      .catch(err => next(err));
  };
};

const validatePassword = () => {
  const MIN_CHARS = 10;
  const MIN_UPPER = 1;
  const MIN_LOWER = 1;
  const MIN_DIGIT = 1;

  return (req, res, next) => {
    const password = get(req, 'body.data.password');

    if (!password) {
      throw new BadRequestError('A password must be provided');
    }

    if (password.length < MIN_CHARS) {
      throw new BadRequestError(`Password must be at least ${MIN_CHARS} characters`);
    }

    if ((password.match(/[A-Z]/g) || []).length < MIN_UPPER) {
      throw new BadRequestError(`Password must have at least ${MIN_UPPER} uppercase characters`);
    }

    if ((password.match(/[a-z]/g) || []).length < MIN_LOWER) {
      throw new BadRequestError(`Password must have at least ${MIN_LOWER} lowercase characters`);
    }

    if ((password.match(/\d/g) || []).length < MIN_DIGIT) {
      throw new BadRequestError(`Password must have at least ${MIN_DIGIT} digits`);
    }

    next();
  };
};

const updatePassword = (settings) => {
  const keycloak = Keycloak(settings.auth);

  return (req, res, next) => {
    const { Profile } = req.models;

    return Promise.resolve()
      .then(() => {
        const newPassword = get(req, 'body.data.password');
        const user = { id: req.user.id, email: req.user.profile.email };
        return keycloak.updatePassword({ user, newPassword });
      })
      .catch(err => {
        const error = new Error('There was a problem updating the user\'s password in keycloak');
        error.keycloak = err;
        throw error;
      })
      .then(() => Profile.query().findById(req.profileId))
      .then(profile => {
        res.response = profile;
      })
      .then(() => next())
      .catch(next);
  };
};

const logout = settings => {
  const keycloak = Keycloak(settings.auth);

  return (req, res, next) => {
    const user = { id: req.user.id, email: req.user.profile.email };

    return keycloak.terminateUserSessions({ user })
      .catch(err => {
        const error = new Error('There was a problem terminating the user\'s sessions in keycloak');
        error.keycloak = err;
        throw error;
      })
      .then(() => {
        res.response = req.user.profile;
      })
      .then(() => next())
      .catch(next);
  };
};

const getSingleProfile = req => {
  if (!isUUID(req.profileId)) {
    throw new NotFoundError();
  }
  const { Profile } = req.models;
  const isOwnProfile = req.profileId === req.user.profile.id;

  const scopeParams = {
    id: req.profileId,
    userId: req.user.profile.id
  };

  if (!isOwnProfile && !req.user.profile.asruUser) {
    scopeParams.establishmentId = (req.establishment && req.establishment.id) || undefined;
  }

  const profileQueries = Profile.scopeSingle(scopeParams);

  if (isOwnProfile) {
    return profileQueries.get();
  }

  return Promise.resolve()
    .then(() => req.user.can('profile.read.all', req.params))
    .then(allowed => {
      if (allowed) {
        return profileQueries.get();
      }
      return Promise.resolve()
        .then(() => req.user.can('profile.read.basic', req.params))
        .then(allowed => {
          if (allowed) {
            return profileQueries.getNamed();
          }

          throw new NotFoundError();
        });
    })
    .then(profile => {
      if (!profile) {
        throw new NotFoundError();
      }
      if (req.establishment && req.establishment.id && !some(profile.establishments, est => est.id === req.establishment.id)) {
        throw new NotFoundError();
      }
      return profile;
    })
    .then(profile => {
      if (!profile.asruUser) {
        delete profile.asruLicensing;
        delete profile.asruInspector;
        delete profile.asruAdmin;
        delete profile.asruSupport;
        delete profile.asruRops;
      }
      return profile;
    });
};

function getMostRecent(pils) {
  return pils.filter(p => p && p.updatedAt).sort((a, b) => b.updatedAt - a.updatedAt).pop();
}

function getStatus(pils) {
  if (some(pils, p => p && p.status === 'active')) {
    return 'active';
  }

  const mostRecent = getMostRecent(pils);
  return mostRecent.status;
}

const getPil = (req, res, next) => {
  const { pil, trainingPils } = req.profile;

  const activeTrainingPils = trainingPils.filter(p => p.status === 'active');

  if (!pil && !activeTrainingPils.length) {
    req.pil = null;
    return next();
  }

  const pilContainer = {
    procedures: []
  };

  const pils = [ pil, ...trainingPils ];

  if ((pil && pil.status === 'active') || !activeTrainingPils.length) {
    Object.assign(pilContainer, pil);
    pilContainer.procedures = (pil.procedures || [])
      .map(p => ({ key: p }));
  } else {
    pilContainer.status = getStatus([pil, ...trainingPils]);
    pilContainer.onlyCatE = true;

    if (pilContainer.status === 'revoked') {
      pilContainer.revocationDate = moment.max(pils.filter(p => p && p.revocationDate).map(d => moment(d.revocationDate))).toISOString();
    }
  }

  if (pilContainer.establishment && !req.user.profile.asruUser) {
    const profileEsts = (req.user.profile.establishments || []).map(e => e.id);
    if (!profileEsts.includes(pilContainer.establishment.id)) {
      delete pilContainer.establishment;
    }
  }

  if (!pil) {
    if (trainingPils.every(p => p.trainingCourse.establishmentId === trainingPils[0].trainingCourse.establishmentId)) {
      pilContainer.establishment = trainingPils[0].trainingCourse.establishment;
    } else {
      pilContainer.multipleEstablishments = true;
    }
  }

  pilContainer.licenceNumber = req.profile.pilLicenceNumber;

  pilContainer.issueDate = moment.min(pils.filter(p => p && p.issueDate).map(d => moment(d.issueDate))).toISOString();
  pilContainer.updatedAt = getMostRecent(pils).updatedAt;

  pilContainer.procedures = (pilContainer.procedures || [])
    .concat(activeTrainingPils.map(p => ({ key: 'E', ...p })))
    .sort((a, b) => b.key - a.key);

  req.pil = pilContainer;
  next();
};

module.exports = (settings) => {
  const router = Router({ mergeParams: true });

  router.use('/certificate(s)?', require('./certificates'));

  router.use((req, res, next) => {
    Promise.resolve()
      .then(() => getSingleProfile(req))
      .then(profile => {
        if (profile.pil) {
          profile.pil = attachReviewDue(profile.pil, 3, 'months');
        }
        req.profile = profile;
        next();
      })
      .catch(next);
  });

  router.get('/', getPil, (req, res, next) => {
    req.profile.pil = req.pil;
    res.response = req.profile;
    next();
  }, fetchOpenProfileTasks());

  router.put('/email',
    permissions('profile.update', req => ({ profileId: req.profileId })),
    whitelist('email'),
    validateEmail(),
    update()
  );

  router.put('/password',
    permissions('profile.update', req => ({ profileId: req.profileId })),
    whitelist('password'),
    validatePassword(),
    updatePassword(settings)
  );

  router.post('/logout',
    permissions('profile.update', req => ({ profileId: req.profileId })),
    logout(settings)
  );

  router.put('/',
    permissions('profile.update', req => ({ profileId: req.profileId })),
    whitelist('firstName', 'lastName', 'dob', 'telephone', 'telephoneAlt'),
    validate(),
    updateDataAndStatus(),
    update()
  );

  router.get('/pil',
    permissions('pil.readCombinedPil'),
    getPil,
    (req, res, next) => {
      res.response = req.pil;
      next();
    },
    fetchOpenTasks(),
    fetchReminders('pil')
  );

  return router;
};
