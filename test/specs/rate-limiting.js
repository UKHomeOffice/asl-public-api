const Api = require('../../lib/api');
const redis = require('redis');
const WithUser = require('../helpers/with-user');
const request = require('supertest');

require('dotenv').config();

const settings = {
  database: process.env.POSTGRES_DB || 'asl-test',
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost'
};

describe('rate limiting', () => {

  beforeEach(() => {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost'
    });
    this.client.del('ratelimit:/establishments:get:user.id:abc123');
    const api = Api({
      auth: false,
      log: { level: 'error' },
      db: settings,
      redis: {
        host: process.env.REDIS_HOST || 'localhost'
      },
      limiter: { total: 1 }
    });
    this.rateLimitedApi = WithUser(api, {});
  });

  afterEach(() => {
    this.client.end(true);
    return this.rateLimitedApi && this.rateLimitedApi.app.db.destroy();
  });

  it('will reject the second request made by a user', () => {
    return request(this.rateLimitedApi)
      .get('/establishments')
      .expect(200)
      .then(() => {
        return request(this.rateLimitedApi)
          .get('/establishments')
          .expect(429);
      });
  });

  it('will not reject requests to a users profile - /me', () => {
    return request(this.rateLimitedApi)
      .get('/me')
      .expect(200)
      .then(() => {
        return request(this.rateLimitedApi)
          .get('/me')
          .expect(200);
      });
  });

});
