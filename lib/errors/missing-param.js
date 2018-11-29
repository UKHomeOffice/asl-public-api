class MissingParamError extends Error {
  constructor(param) {
    super(`'${param}' is required`);
  }

  get status() {
    return 400;
  }
}

module.exports = MissingParamError;
