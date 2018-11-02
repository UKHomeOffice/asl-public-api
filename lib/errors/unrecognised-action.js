class UnrecognisedActionError extends Error {

  constructor() {
    super('unrecognised action');
    this.status = 404;
  }

}

module.exports = UnrecognisedActionError;
