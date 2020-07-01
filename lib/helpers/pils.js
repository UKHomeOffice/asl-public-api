const moment = require('moment');

const attachReviewDue = (months = 3) => pil => {
  return {
    ...pil,
    reviewDue: moment(pil.reviewDate).isBefore(moment().add(months, 'months')),
    reviewOverdue: moment(pil.reviewDate).isBefore(moment())
  };
};

module.exports = {
  attachReviewDue
};
