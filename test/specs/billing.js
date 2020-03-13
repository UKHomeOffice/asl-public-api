const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');

const PIL_1 = '9fbe0218-995d-47d3-88e7-641fc046d7d1';
const PIL_2 = '117298fa-f98f-4a98-992d-d29b60703866';

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

  it('defaults year to 2019 if not provided', () => {
    return request(this.api)
      .get('/establishment/100/billing')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.meta.year, 2019);
      });
  });

  it('returns number of billable PILs for the establishment', () => {
    return request(this.api)
      .get('/establishment/100/billing?year=2019')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.numberOfPils, 4);
      });
  });

  it('includes transfered PILs in the response', () => {
    return request(this.api)
      .get('/establishment/101/billing?year=2018')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.numberOfPils, 1);
      });
  });

  it('returns pils, pel and total fees', () => {
    return request(this.api)
      .get('/establishment/100/billing?year=2019')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.pils, 4 * 275);
        assert.equal(response.body.data.pel, 826);
        assert.equal(response.body.data.total, (4 * 275) + 826);
      });
  });

  it('returns a PEL fee of zero if the establishment was inactive', () => {
    return request(this.api)
      .get('/establishment/101/billing?year=2018')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.pel, 0);
        assert.equal(response.body.data.total, response.body.data.pils);
      });
  });

  it('returns a PEL fee of zero if the establishment was revoked before the billing period', () => {
    return request(this.api)
      .get('/establishment/1000/billing?year=2019')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.pel, 0);
      });
  });

  it('returns a PEL fee if the establishment was revoked during the billing period', () => {
    return request(this.api)
      .get('/establishment/1001/billing?year=2019')
      .expect(200)
      .expect(response => {
        assert.equal(response.body.data.pel, 826);
      });
  });

  it('returns fees for the current year in response', () => {
    return request(this.api)
      .get('/establishment/100/billing?year=2018')
      .expect(200)
      .expect(response => {
        assert.deepEqual(response.body.data.fees, { pil: 257, pel: 757 });
      });
  });

  describe('/billing/pils', () => {

    it('returns list of billable PILs for the establishment', () => {
      return request(this.api)
        .get('/establishment/100/billing/pils?year=2019')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.length, 4);
        });
    });

    it('removes `pilTransfers` property from PIL response', () => {
      return request(this.api)
        .get('/establishment/100/billing/pils?year=2019')
        .expect(200)
        .expect(response => {
          response.body.data.forEach(pil => {
            assert.equal(pil.pilTransfers, undefined);
          });
        });
    });

    it('only returns current establishment on profile where user has multiple establishments', () => {
      return request(this.api)
        .get('/establishment/100/billing/pils?year=2019')
        .expect(200)
        .expect(response => {
          const pil = response.body.data.find(p => p.id === PIL_2);
          assert.equal(pil.profile.establishments.length, 1);
          assert.equal(pil.profile.establishments[0].id, 100);
        });
    });

    it('does not return establishments on profile is user is no longer affiliated to scoped establishment', () => {
      return request(this.api)
        .get('/establishment/101/billing/pils?year=2018')
        .expect(200)
        .expect(response => {
          const pil = response.body.data.find(p => p.id === PIL_1);
          assert.equal(pil.profile.establishments.length, 0);
        });
    });

    it('sets establishment id on PIL to scoped establishment even if they no longer hold it', () => {
      return request(this.api)
        .get('/establishment/101/billing/pils?year=2018')
        .expect(200)
        .expect(response => {
          response.body.data.forEach(pil => {
            assert.equal(pil.establishmentId, 101);
          });
        });
    });

    it('sets start date on returned PILs', () => {
      return request(this.api)
        .get('/establishment/100/billing/pils?year=2019')
        .expect(200)
        .expect(response => {
          const transfered = response.body.data.find(pil => pil.id === PIL_1);
          const notTransfered = response.body.data.find(pil => pil.id === PIL_2);
          assert.equal(transfered.startDate, '2019-01-01T12:00:00.000Z'); // start date is transfer date
          assert.equal(notTransfered.startDate, '2016-01-01T12:00:00.000Z'); // start date is issue date
        });
    });

    it('sets end date on returned PILs', () => {
      return request(this.api)
        .get('/establishment/101/billing/pils?year=2018')
        .expect(200)
        .expect(response => {
          const transfered = response.body.data.find(pil => pil.id === PIL_1);
          assert.equal(transfered.endDate, '2019-01-01T12:00:00.000Z'); // end date is transfer date
        });
    });

    it('does not set end date on active PILs with a revocation date', () => {
      return request(this.api)
        .get('/establishment/100/billing/pils?year=2018')
        .expect(200)
        .expect(response => {
          const active = response.body.data.find(pil => pil.id === PIL_2);
          assert.equal(active.endDate, null);
        });
    });

    it('can filter the results by profile name', () => {
      return request(this.api)
        .get('/establishment/100/billing/pils?year=2019&filter=christie')
        .expect(200)
        .expect(response => {
          const pils = response.body.data;
          assert.equal(pils.length, 1);
          assert.equal(pils[0].id, PIL_1);
        });
    });

    it('can filter the results by pil number', () => {
      return request(this.api)
        .get('/establishment/100/billing/pils?year=2019&filter=c-987')
        .expect(200)
        .expect(response => {
          const pils = response.body.data;
          assert.equal(pils.length, 1);
          assert.equal(pils[0].id, PIL_2);
        });
    });

  });

});
