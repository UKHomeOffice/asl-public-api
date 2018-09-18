class UnauthorisedError extends Error {
  constructor() {
    super('Unauthorised');
  }

  get status() {
    return 403;
  }
}

module.exports = UnauthorisedError;
