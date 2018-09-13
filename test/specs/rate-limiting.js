const apiHelper = require('../helpers/api');
const redis = require('redis');
const request = require('supertest');

require('dotenv').config();

describe('rate limiting', () => {

  beforeEach(done => {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost'
    });
    const options = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost'
      },
      limiter: { total: 1 }
    };
    apiHelper.create(options)
      .then(api => {
        this.rateLimitedApi = api.api;
        this.client.del('ratelimit:user.id:abc123', done);
      });
  });

  afterEach(() => {
    this.client.end(true);
    return apiHelper.destroy();
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

  it('will reject the second request made by a user to a different url', () => {
    this.rateLimitedApi.setUser({ establishment: '100' });
    return request(this.rateLimitedApi)
      .get('/establishments')
      .expect(200)
      .then(() => {
        return request(this.rateLimitedApi)
          .get('/establishment/100')
          .expect(429);
      });
  });

  it('will reject the second request made by a user with a different method', () => {
    return request(this.rateLimitedApi)
      .get('/establishments')
      .expect(200)
      .then(() => {
        return request(this.rateLimitedApi)
          .post('/establishment')
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
