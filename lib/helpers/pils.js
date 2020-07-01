const moment = require('moment');

function attachReviewDue(pil) {
  return {
    ...pil,
    reviewDue: moment(pil.reviewDate).isBefore(moment().add(3, 'months')),
    reviewOverdue: moment(pil.reviewDate).isBefore(moment())
  };
}

module.exports = {
  attachReviewDue
};
