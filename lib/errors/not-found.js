class NotFoundError extends Error {

  constructor() {
    super('Not found');
    this.status = 404;
  }

}

module.exports = NotFoundError;
