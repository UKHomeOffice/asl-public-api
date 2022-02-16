const { Router } = require('express');
const moment = require('moment');
const { permissions } = require('../../middleware');

const raDueQuery = models => {
  const { Project } = models;

  return Project.query()
    .whereIn('projects.status', ['expired', 'revoked'])
    .whereNotNull('projects.raDate')
    .whereNotExists(
      Project.relatedQuery('retrospectiveAssessments')
        .whereIn('retrospectiveAssessments.status', ['submitted', 'granted'])
    );
};

const ropsDueQuery = (models, ropsYear) => {
  const { Project } = models;

  return Project.query()
    .select('projects.*')
    .selectRopsDeadline(ropsYear)
    .whereRopsDue(ropsYear)
    .whereRopsOutstanding(ropsYear);
};

const getPersonalAlerts = async (profile, models, ropsYears) => {
  const alerts = [];
  const pil = profile.pil;

  if (pil && pil.reviewDue) {
    alerts.push({
      type: 'pilReview',
      model: pil,
      deadline: pil.reviewDate,
      overdue: pil.reviewOverdue
    });
  }

  const raProjects = await raDueQuery(models).where({ licenceHolderId: profile.id });

  raProjects.forEach(project => {
    alerts.push({
      type: 'raDue',
      model: project,
      deadline: project.raDate,
      overdue: moment(project.raDate).isBefore(moment())
    });
  });

  for (const ropsYear of ropsYears) {
    const ropsProjects = await ropsDueQuery(models, ropsYear).where({ licenceHolderId: profile.id });

    ropsProjects.forEach(project => {
      alerts.push({
        type: 'ropDue',
        model: project,
        deadline: project.ropsDeadline,
        overdue: moment(project.ropsDeadline).isBefore(moment()),
        ropsYear
      });
    });
  }

  return alerts;
};

function isNtcoAtEstablishment(profile, estId) {
  return !!(profile.roles || []).find(role => role.establishmentId === estId && role.type === 'ntco');
}

const getEstablishmentAlerts = async (profile, models, ropsYears) => {
  const alerts = [];
  const adminAtEstablishments = (profile.establishments || []).filter(e => e.role === 'admin');
  const ntcoAtEstablishments = (profile.establishments || []).filter(e => isNtcoAtEstablishment(profile, e.id));
  const pilReviewEstablishments = adminAtEstablishments.concat(ntcoAtEstablishments);

  if (pilReviewEstablishments.length > 0) {
    const { PIL } = models;

    const pilReviews = await PIL.query()
      .where({ status: 'active' })
      .where('reviewDate', '<', moment().add(1, 'month'))
      .whereIn('establishmentId', pilReviewEstablishments.map(e => e.id));

    pilReviews.forEach(pil => {
      alerts.push({
        type: 'pilReview',
        model: pil,
        establishmentId: pil.establishmentId,
        deadline: pil.reviewDate,
        overdue: moment(pil.reviewDate).isBefore(moment())
      });
    });
  }

  if (adminAtEstablishments.length > 0) {
    const raProjects = await raDueQuery(models)
      .whereIn('projects.establishmentId', adminAtEstablishments.map(e => e.id));

    raProjects.forEach(project => {
      alerts.push({
        type: 'raDue',
        model: project,
        establishmentId: project.establishmentId,
        deadline: project.raDate,
        overdue: moment(project.raDate).isBefore(moment())
      });
    });

    for (const ropsYear of ropsYears) {
      const ropsProjects = await ropsDueQuery(models, ropsYear)
        .whereIn('projects.establishmentId', adminAtEstablishments.map(e => e.id));

      ropsProjects.forEach(project => {
        alerts.push({
          type: 'ropDue',
          model: project,
          establishmentId: project.establishmentId,
          deadline: project.ropsDeadline,
          overdue: moment(project.ropsDeadline).isBefore(moment()),
          ropsYear
        });
      });
    }
  }

  return alerts;
};

module.exports = () => {
  const router = Router({ mergeParams: true });

  router.get('/',
    permissions('profile.alerts', req => ({ profileId: req.profile.id })),
    async (req, res, next) => {
      const personalCutoff = moment().add(3, 'months');
      const ropsCutoff = moment().add(1, 'month');
      const establishmentCutoff = moment().add(1, 'month');

      const now = new Date();
      const ropsYears = [now.getFullYear() - 1, now.getFullYear()];

      const personalAlerts = await getPersonalAlerts(req.profile, req.models, ropsYears);
      const establishmentAlerts = await getEstablishmentAlerts(req.profile, req.models, ropsYears);

      res.response = {
        personal: personalAlerts.filter(a => moment(a.deadline).isBefore(a.type === 'ropDue' ? ropsCutoff : personalCutoff)),
        establishments: establishmentAlerts.filter(a => moment(a.deadline).isBefore(establishmentCutoff))
      };
      next();
    }
  );

  return router;
};
