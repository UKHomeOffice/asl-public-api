const assert = require('assert');
const request = require('supertest');

const Database = require('./helpers/db');
const Api = require('../lib/api');
const data = require('./data');

const settings = {
  username: process.env.POSTGRES_USER || 'asl-test',
  host: process.env.POSTGRES_HOST || 'localhost'
};

describe('API', () => {

  beforeEach(() => {
    console.log(settings);
    return Database(settings).init(data.default)
      .then(() => {
        this.api = Api({
          auth: false,
          log: { level: 'silent' },
          db: settings
        });
      });
  });

  afterEach(() => {
    return this.api && this.api.db.close();
  });

  describe('/establishment/:id', () => {

    it('returns a 404 error for unknown establishment id', () => {
      return request(this.api)
        .get('/establishment/nope')
        .expect(404);
    });

    it('returns the establishment details when provided a valid id', () => {
      return request(this.api)
        .get('/establishment/100')
        .expect(200)
        .expect(response => {
          assert.equal(response.body.data.name, 'University of Croydon');
        });
    });

    describe('/places', () => {

      it('returns only the places related to the current establishment', () => {
        return request(this.api)
          .get('/establishment/100/places')
          .expect(200)
          .expect(response => {
            assert.equal(response.body.data.length, 2);
            response.body.data.forEach(row => {
              assert.equal(row.site, 'Lunar House');
            });
          });
      });

    });

  });

});
