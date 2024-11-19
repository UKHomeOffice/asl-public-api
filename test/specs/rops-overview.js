const assert = require('assert');
const request = require('supertest');
const { stringify } = require('qs');
const moment = require('moment');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('ROPs overview', () => {
  beforeEach(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
      });
  });

  afterEach(() => {
    return apiHelper.destroy();
  });

  it('returns 400 for missing ropsYear', () => {
    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/rops`)
      .expect(400);
  });

  it('returns only the ROPs related to the current establishment', () => {
    const query = stringify({
      ropsStatus: 'outstanding',
      ropsYear: 2021
    });

    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/rops?${query}`)
      .expect(200)
      .expect(response => {
        assert(response.body.data.length > 0);
        response.body.data.forEach(row => {
          assert.deepStrictEqual(row.establishmentId, ids.establishments.croydon);
        });
      });
  });

  it('all outstanding ROPs have a deadline', () => {
    const query = stringify({
      ropsStatus: 'outstanding',
      ropsYear: 2021
    });

    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/rops?${query}`)
      .expect(200)
      .expect(response => {
        assert(response.body.data.length > 0);
        response.body.data.forEach(project => {
          assert.ok(project.ropsDeadline, 'the project should have a rops deadline');
          assert.ok(moment(project.ropsDeadline).isValid(), 'the rops deadline should be a valid date');
        });
      });
  });

  it('all submitted ROPs have a submitted date', () => {
    const query = stringify({
      ropsStatus: 'submitted',
      ropsYear: 2020
    });

    return request(this.api)
      .get(`/establishment/${ids.establishments.croydon}/rops?${query}`)
      .expect(200)
      .expect(response => {
        assert(response.body.data.length > 0);
        response.body.data.forEach(project => {
          assert.ok(project.ropsSubmittedDate, 'the project should have a rops submitted date');
          assert.ok(moment(project.ropsSubmittedDate).isValid(), 'the rops submitted date should be a valid date');
        });
      });
  });

  function assertDownloadRowsForYear(api, year, expectedCount) {
    return request(api)
      .get(`/establishment/${ids.establishments.croydon}/rops/download?year=${year}`)
      .expect(200)
      .expect(response => {
        assert.equal(
          response.body.data.length,
          expectedCount,
          `Unexpected number of RoPs downloaded for ${year}.`
        );
      });
  }

  // Test data has submitted RoPs for 2019, 2020, and a draft for 2021

  it('should not return any rows when downloading rops for a year with no submission', () => {
    return assertDownloadRowsForYear(this.api, 2022, 0);
  });

  it('should not return any rows when downloading rops for a year with a draft RoP', () => {
    return assertDownloadRowsForYear(this.api, 2021, 0);
  });

  it('should return the specified year\'s rop when downloading rops for a year with a submitted RoP', () => {
    return assertDownloadRowsForYear(this.api, 2020, 1);
  });

});
