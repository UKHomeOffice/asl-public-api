const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

describe('/profiles', () => {
  before(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
      });
  });

  after(() => {
    return apiHelper.destroy();
  });

  it('returns the profile data for the users own profile', () => {
    this.api.setUser({ id: 'abc123' });
    return request(this.api)
      .get('/me')
      .expect(200)
      .expect(profile => {
        assert.equal(profile.body.data.firstName, 'Linford');
        assert.equal(profile.body.data.lastName, 'Christie');
      });
  });

  it('includes asru permission fields', () => {
    this.api.setUser({ id: 'def456' });
    return request(this.api)
      .get('/me')
      .expect(200)
      .expect(profile => {
        assert.equal(profile.body.data.firstName, 'Inspector');
        assert.equal(profile.body.data.lastName, 'Morse');
        assert.ok(profile.body.data.hasOwnProperty('asru'), 'includes asru property on profile');
        assert.deepEqual(profile.body.data.asru, { admin: false, licensing: false, inspector: true });

        assert.ok(!profile.body.data.hasOwnProperty('asru_user'), 'does not include asru_user property on profile');
        assert.ok(!profile.body.data.hasOwnProperty('asru_admin'), 'does not include asru_admin property on profile');
        assert.ok(!profile.body.data.hasOwnProperty('asru_licensing'), 'does not include asru_licensing property on profile');
        assert.ok(!profile.body.data.hasOwnProperty('asru_inspector'), 'does not include asru_inspector property on profile');
      });
  });

  it('non-asru users profiles do not include asru permission fields', () => {
    this.api.setUser({ id: 'abc123' });
    return request(this.api)
      .get('/me')
      .expect(200)
      .expect(profile => {
        assert.ok(!profile.body.data.hasOwnProperty('asru'), 'does not include asru property on profile');
        assert.ok(!profile.body.data.hasOwnProperty('asru_user'), 'does not include asru_user property on profile');
        assert.ok(!profile.body.data.hasOwnProperty('asru_admin'), 'does not include asru_admin property on profile');
        assert.ok(!profile.body.data.hasOwnProperty('asru_licensing'), 'does not include asru_licensing property on profile');
        assert.ok(!profile.body.data.hasOwnProperty('asru_inspector'), 'does not include asru_inspector property on profile');
      });
  });

});
