const { pick, groupBy } = require('lodash');
const moment = require('moment');

const isAsruOrLicenceHolder = (profile, model) => {
  const isAsru = !!profile.asruUser;
  const licenceHolderId = model.licenceHolderId || model.profileId;

  if (licenceHolderId) {
    return isAsru || profile.id === licenceHolderId;
  }

  return isAsru || !!(model.roles || []).find(r => r.type === 'pelh' && r.profileId === profile.id);
};

const mapRemindersToConditions = (conditions, reminders) => {
  return conditions.map(condition => {
    const conditionReminders = reminders.filter(r => r.conditionKey === condition.key);

    if (conditionReminders.length > 0) {
      condition.reminders = {
        [condition.key]: [
          ...conditionReminders.map(r => pick(r, ['id', 'deadline']))
        ],
        active: [condition.key]
      };
    }

    return condition;
  });
};

module.exports = modelType => async (req, res, next) => {
  const { Reminder } = req.models;

  const remindersQuery = ({ modelType, modelId }) => Reminder.query()
    .where({ modelType, modelId })
    .withGraphFetched('dismissed')
    .orderBy('reminders.deadline', 'asc'); // closest deadline first

  switch (modelType) {
    case 'project':
      if (!req.project || !isAsruOrLicenceHolder(req.user.profile, req.project)) {
        return next();
      }

      const oneMonthFromNow = moment().add(1, 'month').format('YYYY-MM-DD');

      const imminentReminders = await remindersQuery({ modelType: 'project', modelId: req.project.id })
        .where('reminders.deadline', '<=', oneMonthFromNow)
        .where({ status: 'active' });

      req.project.reminders = groupBy(imminentReminders, 'conditionKey');
      break;

    case 'projectVersion':
      if (!req.project || !req.version || !isAsruOrLicenceHolder(req.user.profile, req.project)) {
        return next();
      }

      const projectReminders = await remindersQuery({ modelType: 'project', modelId: req.project.id })
        .where(qb1 => {
          qb1.where({ status: 'active' })
            .orWhere(qb2 => {
              qb2.where({ status: 'pending' }).andWhere('createdAt', '>', req.version.createdAt);
            });
        });

      if (projectReminders.length > 0) {
        if (req.version.data.conditions) {
          req.version.data.conditions = mapRemindersToConditions(req.version.data.conditions, projectReminders);
        }

        if (req.version.data.protocols) {
          req.version.data.protocols = req.version.data.protocols.map(protocol => {
            if (protocol.conditions) {
              protocol.conditions = mapRemindersToConditions(protocol.conditions, projectReminders);
            }

            return protocol;
          });
        }
      }
      break;

    case 'establishment':
      if (!req.establishment || !isAsruOrLicenceHolder(req.user.profile, req.establishment)) {
        return next();
      }

      req.establishment.reminders = await Reminder.query()
        .where({ modelType: 'establishment', establishmentId: req.establishment.id, modelId: null })
        .withGraphFetched('dismissed')
        .orderBy('reminders.deadline', 'asc'); // closest deadline first
      break;

    case 'pil':
      if (!req.pil || !isAsruOrLicenceHolder(req.user.profile, req.pil)) {
        return next();
      }

      req.pil.reminders = await remindersQuery({ modelType: 'pil', modelId: req.pil.id });
      break;
  }

  next();
};
