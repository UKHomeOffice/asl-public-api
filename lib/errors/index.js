module.exports = {
  NotFoundError: require('./not-found'),
  RateLimitedError: require('./rate-limited'),
  UnauthorisedError: require('./unauthorised'),
  UnrecognisedActionError: require('./unrecognised-action'),
  MissingParamError: require('./missing-param')
};
