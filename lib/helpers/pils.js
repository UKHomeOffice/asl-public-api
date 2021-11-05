const moment = require('moment');

const attachReviewDue = (pil, n = 3, unit = 'months') => {
  if (pil.status !== 'active') {
    return pil;
  }
  pil.reviewDate = pil.reviewDate || moment(pil.updatedAt).add(5, 'years').toISOString();
  return {
    ...pil,
    reviewDue: moment(pil.reviewDate).isBefore(moment().add(n, unit)),
    reviewOverdue: moment(pil.reviewDate).isBefore(moment())
  };
};

module.exports = {
  attachReviewDue
};
