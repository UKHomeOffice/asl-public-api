const assert = require('assert');
const request = require('supertest');
const { stringify } = require('qs');
const apiHelper = require('../helpers/api');

describe('/profiles', () => {
  before(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.workflow = api.workflow;
      });
  });

  after(() => {
    return apiHelper.destroy();
  });

  it('returns only the profiles related to the current establishment', () => {
    return request(this.api)
      .get('/establishment/100/profiles')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 5);
        response.body.data.forEach(profile => {
          profile.establishments.forEach(establishment => {
            assert.equal(establishment.id, 100);
          });
        });
      });
  });

  it('returns a list that includes the `name` virtual property', () => {
    return request(this.api)
      .get('/establishment/100/profiles')
      .expect(200)
      .expect(response => {
        assert(response.body.data.length > 0);
        response.body.data.forEach(profile => {
          assert.equal(typeof profile.name, 'string');
        });
      });
  });

  it('can filter on a role type', () => {
    const query = stringify({
      filters: {
        roles: ['nacwo']
      }
    });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 2);
        response.body.data.forEach(profile => {
          assert.equal(profile.roles.length, 1);
          assert.equal(profile.roles[0].type, 'nacwo');
        });
      });
  });

  it('can search on full name', () => {
    const query = stringify({ search: 'Linford Christie' });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
      });
  });

  it('can search on full name', () => {
    const query = stringify({ search: 'Linford Christina' });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 0);
      });
  });

  it('can search on firstName', () => {
    const query = stringify({ search: 'Linford' });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
      });
  });

  it('can search on firstName', () => {
    const query = stringify({ search: 'Linfordia' });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 0);
      });
  });

  it('can search on lastName', () => {
    const query = stringify({ search: 'Christie' });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
      });
  });

  it('can search on lastName', () => {
    const query = stringify({ search: 'Christina' });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 0);
      });
  });

  it('can filter on a role type and search name', () => {
    const query = stringify({
      filters: {
        roles: ['pelh']
      },
      search: 'colin'
    });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
        assert.equal(response.body.data[0].name, 'Colin Jackson');
      });
  });

  it('returns only the ELH for the requested establishment', () => {
    const query = stringify({
      filters: {
        roles: ['pelh']
      }
    });
    return request(this.api)
      .get(`/establishment/100/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
        assert.equal(response.body.data[0].roles.length, 1);
      });
  });

  it('returns only the PELH for the requested establishment', () => {
    const query = stringify({
      filters: {
        roles: ['pelh']
      }
    });
    return request(this.api)
      .get(`/establishment/101/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
        assert.equal(response.body.data[0].roles.length, 1);
      });
  });

  describe('/profile/:id', () => {

    it('returns the profile data for an individual profile', () => {
      return request(this.api)
        .get('/establishment/100/profile/f0835b01-00a0-4c7f-954c-13ed2ef7efd9')
        .expect(200)
        .expect(profile => {
          assert.equal(profile.body.data.name, 'Linford Christie');
        });
    });

    it('includes the PIL data if it exists', () => {
      return request(this.api)
        .get('/establishment/100/profile/f0835b01-00a0-4c7f-954c-13ed2ef7efd9')
        .expect(200)
        .expect(profile => {
          assert.equal(profile.body.data.pil.licenceNumber, 'ABC123');
        });
    });

    it('returns a NACWO role for NACWOs without places', () => {
      return request(this.api)
        .get('/establishment/100/profile/a942ffc7-e7ca-4d76-a001-0b5048a057d9')
        .expect(200)
        .expect(profile => {
          assert.deepEqual(profile.body.data.roles.map(r => r.type), ['nacwo']);
        });
    });

  });

});
