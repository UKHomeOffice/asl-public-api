class MissingParamError extends Error {
  constructor(param) {
    super(`'${param}' is required`);
  }

  get status() {
    return 404;
  }
}

module.exports = MissingParamError;
