class BadRequestError extends Error {
  constructor(msg) {
    super(msg || 'Bad request');
  }

  get status() {
    return 400;
  }
}

module.exports = BadRequestError;
