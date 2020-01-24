const { Router } = require('express');
const isUUID = require('uuid-validate');
const { get, uniq } = require('lodash');
const { fetchOpenTasks, permissions, whitelist, validateSchema, updateDataAndStatus } = require('../../middleware');
const { NotFoundError, BadRequestError } = require('../../errors');

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
      return profile;
    })
    .then(profile => {
      if (!profile.asruUser) {
        delete profile.asruLicensing;
        delete profile.asruInspector;
        delete profile.asruAdmin;
      }
      return profile;
    });
};

const router = Router({ mergeParams: true });

function mapSpeciesFromModules(cert) {
  if (cert.species && cert.species.length) {
    return cert;
  }
  const species = uniq((cert.modules || []).reduce((arr, mod) => [ ...arr, ...(mod.species || []) ], []));
  return { ...cert, species };
}

router.get('/', (req, res, next) => {
  Promise.resolve()
    .then(() => getSingleProfile(req))
    .then(profile => {
      if (profile && profile.certificates) {
        profile.certificates = profile.certificates.map(mapSpeciesFromModules);
      }
      res.response = profile;
      next();
    })
    .catch(next);
}, fetchOpenTasks);

router.put('/email',
  permissions('profile.update', req => ({ profileId: req.profileId })),
  whitelist('email'),
  validateEmail(),
  update()
);

router.put('/',
  permissions('profile.update', req => ({ profileId: req.profileId })),
  whitelist('firstName', 'lastName', 'dob', 'telephone'),
  validate(),
  updateDataAndStatus(),
  update()
);

module.exports = router;
