const assert = require('assert');
const moment = require('moment');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('/billing', () => {

  before(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
      });
  });

  after(() => {
    return apiHelper.destroy();
  });

  it('default year to current calendar year if not provided', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/billing`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.meta.year, moment().subtract(1, 'year').format('YYYY'));
      });
  });

  it('returns number of billable PILs for the establishment', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/billing?year=2020`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.numberOfPils, 4);
      });
  });

  it('includes transfered PILs in the response', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.marvell}/billing?year=2019`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.numberOfPils, 1);
      });
  });

  it('returns pils, pel and total fees', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/billing?year=2020`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.pils, 4 * 299);
        assert.equal(response.body.data.pel, 915);
        assert.equal(response.body.data.total, (4 * 299) + 915);
      });
  });

  it('returns a PEL fee of zero if the establishment was inactive', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.marvell}/billing?year=2019`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.pel, 0);
        assert.equal(response.body.data.total, response.body.data.pils);
      });
  });

  it('returns a PEL fee of zero if the establishment was revoked before the billing period', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.revokedEstablishment1}/billing?year=2020`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.pel, 0);
      });
  });

  it('returns a PEL fee if the establishment was revoked during the billing period', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.revokedEstablishment2}/billing?year=2020`)
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.pel, 915);
      });
  });

  it('returns fees for the current year in response', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/billing?year=2019`)
      .expect(200)
      .expect(response => {
        assert.deepEqual(response.body.data.fees, { pil: 275, pel: 826 });
      });
  });

  describe('/billing/pils', () => {

    it('returns list of billable PILs for the establishment', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/billing/pils?year=2020`)
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.length, 4);
        });
    });

    it('removes `pilTransfers` property from PIL response', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/billing/pils?year=2020`)
        .expect(200)
        .expect(response => {
          response.body.data.forEach(pil => {
            assert.equal(pil.pilTransfers, undefined);
          });
        });
    });

    it('only returns current establishment on profile where user has multiple establishments', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/billing/pils?year=2020`)
        .expect(200)
        .expect(response => {
          const pil = response.body.data.find(p => p.id === ids.pils.multipleEstablishments);
          assert.equal(pil.profile.establishments.length, 1);
          assert.equal(pil.profile.establishments[0].id, ids.establishments.croydon);
        });
    });

    it('does not return establishments on profile is user is no longer affiliated to scoped establishment', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.marvell}/billing/pils?year=2019`)
        .expect(200)
        .expect(response => {
          const pil = response.body.data.find(p => p.id === ids.pils.linfordChristie);
          assert.equal(pil.profile.establishments.length, 0);
        });
    });

    it('sets establishment id on PIL to scoped establishment even if they no longer hold it', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.marvell}/billing/pils?year=2019`)
        .expect(200)
        .expect(response => {
          response.body.data.forEach(pil => {
            assert.equal(pil.establishmentId, ids.establishments.marvell);
          });
        });
    });

    it('sets start date on returned PILs', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/billing/pils?year=2020`)
        .expect(200)
        .expect(response => {
          const transfered = response.body.data.find(pil => pil.id === ids.pils.linfordChristie);
          const notTransfered = response.body.data.find(pil => pil.id === ids.pils.multipleEstablishments);
          assert.equal(transfered.startDate, '2020-01-01T12:00:00.000Z'); // start date is transfer date
          assert.equal(notTransfered.startDate, '2016-01-01T12:00:00.000Z'); // start date is issue date
        });
    });

    it('sets end date on returned PILs', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.marvell}/billing/pils?year=2019`)
        .expect(200)
        .expect(response => {
          const transfered = response.body.data.find(pil => pil.id === ids.pils.linfordChristie);
          assert.equal(transfered.endDate, '2020-01-01T12:00:00.000Z'); // end date is transfer date
        });
    });

    it('does not set end date on active PILs with a revocation date', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/billing/pils?year=2019`)
        .expect(200)
        .expect(response => {
          const active = response.body.data.find(pil => pil.id === ids.pils.multipleEstablishments);
          assert.equal(active.endDate, null);
        });
    });

    it('can filter the results by profile name', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/billing/pils?year=2020&filter=christie`)
        .expect(200)
        .expect(response => {
          const pils = response.body.data;
          assert.equal(pils.length, 1);
          assert.equal(pils[0].id, ids.pils.linfordChristie);
        });
    });

    it('can filter the results by pil number', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/billing/pils?year=2020&filter=c-987`)
        .expect(200)
        .expect(response => {
          const pils = response.body.data;
          assert.equal(pils.length, 1);
          assert.equal(pils[0].id, ids.pils.multipleEstablishments);
        });
    });

  });

});
