class UnauthorisedError extends Error {
  constructor(message = 'Unauthorised') {
    super(msg);
  }

  get status() {
    return 403;
  }
}

module.exports = UnauthorisedError;
