const assert = require('assert');
const request = require('supertest');
const { stringify } = require('qs');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

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

  beforeEach(() => {
    // reset user for each test
    this.api.setUser();
  });

  it('returns only the profiles related to the current establishment', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/profiles`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 10);
        response.body.data.forEach(profile => {
          profile.establishments.forEach(establishment => {
            assert.equal(establishment.id, ids.establishments.croydon);
          });
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
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
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
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
      });
  });

  it('can search on full name', () => {
    const query = stringify({ search: 'Linford Christina' });
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 0);
      });
  });

  it('can search on firstName', () => {
    const query = stringify({ search: 'Linford' });
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
      });
  });

  it('can search on firstName', () => {
    const query = stringify({ search: 'Linfordia' });
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 0);
      });
  });

  it('can search on lastName', () => {
    const query = stringify({ search: 'Christie' });
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
      });
  });

  it('can search on lastName', () => {
    const query = stringify({ search: 'Christina' });
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
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
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
        assert.equal(response.body.data[0].firstName, 'Colin');
        assert.equal(response.body.data[0].lastName, 'Jackson');
      });
  });

  it('returns only the ELH for the requested establishment', () => {
    const query = stringify({
      filters: {
        roles: ['pelh']
      }
    });
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/profiles?${query}`)
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
      .get(`/establishment/${ids.establishments.marvell}/profiles?${query}`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.length, 1);
        assert.equal(response.body.data[0].roles.length, 1);
      });
  });

  describe('with basic permissions', () => {

    beforeEach(() => {
      this.api.setUser({
        id: 'basic',
        can: task => Promise.resolve(task !== 'profile.read.all')
      });
    });

    it('returns only named users and the current logged-in user', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profiles`)
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.length, 4, 'The full set of users is not returned');
          assert(response.body.data.find(p => p.userId === 'basic'), 'The currently logged in user is included in the list');
          response.body.data.forEach(profile => {
            const isNamedPerson = profile.roles.length > 0;
            const isLoggedInUser = profile.userId === 'basic';
            assert(isNamedPerson || isLoggedInUser);
          });
        });
    });

  });

  describe('/profile/:id', () => {

    it('returns the profile data for an individual profile', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}`)
        .expect(200)
        .expect(profile => {
          assert.equal(profile.body.data.firstName, 'Linford');
          assert.equal(profile.body.data.lastName, 'Christie');
        });
    });

    it('includes the PIL data if it exists', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}`)
        .expect(200)
        .expect(profile => {
          assert.equal(profile.body.data.pil.id, ids.pils.linfordChristie);
        });
    });

    it('returns a NACWO role for NACWOs without places', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.cliveNacwo}`)
        .expect(200)
        .expect(profile => {
          assert.deepEqual(profile.body.data.roles.map(r => r.type), ['nacwo']);
        });
    });

    it('does not include establishments except the one in scope', () => {
      return request(this.api)
        // get a profile that exists in multiple establishments
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.multipleEstablishments}`)
        .expect(200)
        .expect(profile => {
          assert.equal(profile.body.data.establishments.length, 1);
          assert.equal(profile.body.data.establishments[0].name, 'University of Croydon');
        })
        .then(() => {
          return request(this.api)
            // request the same profile within the scope of the other establishment
            .get(`/establishment/${ids.establishments.marvell}/profile/${ids.profiles.multipleEstablishments}`)
            .expect(200)
            .expect(profile => {
              assert.equal(profile.body.data.establishments.length, 1);
              assert.equal(profile.body.data.establishments[0].name, 'Marvell Pharmaceuticals');
            });
        });
    });

    it('scoping does not apply when ASRU are viewing a profile', () => {
      this.api.setUser({ id: 'licensing' });

      return request(this.api)
        // get a profile that exists in multiple establishments
        .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.multipleEstablishments}`)
        .expect(200)
        .expect(response => {
          const profile = response.body.data;
          assert.equal(profile.establishments.length, 2);
          assert(profile.establishments.find(e => e.name === 'University of Croydon'));
          assert(profile.establishments.find(e => e.name === 'Marvell Pharmaceuticals'));
        });
    });

    it('throws a 404 if scoped to an unaffiliated establishment when ASRU are viewing a profile', () => {
      this.api.setUser({ id: 'licensing' });

      return request(this.api)
        // get a profile that exists in multiple establishments at a completely different establishment
        .get(`/establishment/${ids.establishments.croydon}0/profile/${ids.profiles.multipleEstablishments}`)
        .expect(404)
        .expect(response => {
          assert.ok(!response.body.data, 'Response should not include data');
        });
    });

    describe('with basic permissions', () => {

      beforeEach(() => {
        this.api.setUser({
          id: 'basic',
          can: task => Promise.resolve(task !== 'profile.read.all')
        });
      });

      it('can access the profile of the current logged-in user', () => {
        return request(this.api)
          .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.noddyHolder}`)
          .expect(200)
          .expect(profile => {
            assert.equal(profile.body.data.firstName, 'Noddy');
            assert.equal(profile.body.data.lastName, 'Holder');
          });
      });

      it('can access the profile of a named person', () => {
        return request(this.api)
          .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.cliveNacwo}`)
          .expect(200)
          .expect(profile => {
            assert.equal(profile.body.data.firstName, 'Clive');
            assert.equal(profile.body.data.lastName, 'Nacwo');
          });
      });

      it('cannot access the profile of people who do not have named roles', () => {
        return request(this.api)
          .get(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.linfordChristie}`)
          .expect(404);
      });

    });

  });

});
