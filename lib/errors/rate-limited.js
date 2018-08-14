class RateLimitedError extends Error {

  constructor() {
    super('Rate limit exceeded');
    this.status = 429;
  }

}

module.exports = RateLimitedError;
