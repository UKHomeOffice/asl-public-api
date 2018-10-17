class UnauthorisedError extends Error {
  constructor(msg = 'Unauthorised') {
    super(msg);
  }

  get status() {
    return 403;
  }
}

module.exports = UnauthorisedError;
