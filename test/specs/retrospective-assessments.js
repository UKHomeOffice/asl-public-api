const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('/projects/:projectId/retrospective-assessments', () => {
  before(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.db = api.api.app.db;
        this.workflow = api.workflow;
      })
      .then(() => {
        const { Project } = this.db;
        return Project.query().insertGraph([
          {
            'id': ids.projects.croydon.raSevere,
            'establishmentId': ids.establishments.croydon,
            'title': 'RA due severe procedures',
            'status': 'revoked',
            'issueDate': new Date('2020-06-01').toISOString(),
            'schemaVersion': 1,
            'licenceHolderId': ids.profiles.linfordChristie,
            'revocationDate': new Date('2020-08-01').toISOString(),
            'licenceNumber': 'PR-X567130',
            'raDate': new Date('2025-01-01').toISOString(),
            'species': ['mice'],
            version: [
              {
                'status': 'granted',
                'data': {
                  'title': 'RA due severe procedures',
                  'species': ['mice'],
                  'protocols': [
                    {
                      id: 'c56ff0ed-64a0-409f-a112-3f1884567111',
                      title: 'Protocol 1',
                      complete: true,
                      speciesDetails: [],
                      severity: 'severe',
                      gaas: true
                    }
                  ]
                },
                'createdAt': new Date('2020-06-01').toISOString(),
                'updatedAt': new Date('2020-06-01').toISOString()
              }
            ]
          },
          {
            'id': ids.projects.croydon.raMultiple,
            'establishmentId': ids.establishments.croydon,
            'title': 'RA due multiple reasons (dogs, severe)',
            'status': 'revoked',
            'issueDate': new Date('2020-06-01').toISOString(),
            'schemaVersion': 1,
            'licenceHolderId': ids.profiles.linfordChristie,
            'revocationDate': new Date('2021-01-01').toISOString(),
            'licenceNumber': 'PR-X567131',
            'raDate': new Date('2025-01-01').toISOString(),
            'species': ['beagles'],
            version: [
              {
                'status': 'granted',
                'data': {
                  'title': 'RA due multiple reasons (dogs, severe)',
                  'species': ['beagles'],
                  'protocols': [
                    {
                      id: 'f422b5e4-9866-4b06-adda-1e855e20e188',
                      title: 'Protocol 1',
                      complete: true,
                      speciesDetails: [],
                      severity: 'severe',
                      gaas: true
                    }
                  ]
                },
                'createdAt': new Date('2020-06-01').toISOString(),
                'updatedAt': new Date('2020-06-01').toISOString()
              }
            ]
          },
          {
            'id': ids.projects.croydon.raAsru,
            'establishmentId': ids.establishments.croydon,
            'title': 'RA due asru added',
            'status': 'revoked',
            'issueDate': new Date('2020-06-01').toISOString(),
            'schemaVersion': 1,
            'licenceHolderId': ids.profiles.linfordChristie,
            'revocationDate': new Date('2021-01-01').toISOString(),
            'licenceNumber': 'PR-X567132',
            'raDate': new Date('2025-01-01').toISOString(),
            'species': ['rats'],
            version: [
              {
                'status': 'granted',
                'data': {
                  'title': 'RA due asru added',
                  'species': ['rats'],
                  'retrospectiveAssessment': true
                },
                'createdAt': new Date('2020-06-01').toISOString(),
                'updatedAt': new Date('2020-06-01').toISOString()
              }
            ]
          },
          {
            'id': ids.projects.croydon.raPreviousVersion,
            'establishmentId': ids.establishments.croydon,
            'title': 'RA due previous version',
            'status': 'revoked',
            'issueDate': new Date('2020-06-01').toISOString(),
            'schemaVersion': 1,
            'licenceHolderId': ids.profiles.linfordChristie,
            'revocationDate': new Date('2020-08-01').toISOString(),
            'licenceNumber': 'PR-X567133',
            'raDate': new Date('2025-01-01').toISOString(),
            'species': ['rats'],
            version: [
              {
                'status': 'granted',
                'data': {
                  'title': 'RA due previous version',
                  'species': ['rats']
                },
                'createdAt': new Date('2020-06-02').toISOString(),
                'updatedAt': new Date('2020-06-02').toISOString()
              },
              {
                // same project as above, earlier version with cats to trigger RA
                'status': 'granted',
                'data': {
                  'title': 'RA due previous version',
                  'species': ['cats']
                },
                'createdAt': new Date('2020-06-01').toISOString(),
                'updatedAt': new Date('2020-06-01').toISOString()
              }
            ]
          }
        ]);
      });
  });

  after(() => {
    return apiHelper.destroy();
  });

  describe('/reasons', () => {

    it('can return reasons why RA required', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.raSevere}/retrospective-assessments/reasons`)
        .expect(200)
        .expect(response => {
          const { data } = response.body;
          const expected = { hasSevereProtocols: true };
          assert.deepStrictEqual(data, expected, 'it should return severe protocols as the reason');
        });
    });

    it('can return reasons why RA required when there are multiple', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.raMultiple}/retrospective-assessments/reasons`)
        .expect(200)
        .expect(response => {
          const { data } = response.body;
          const expected = { hasSevereProtocols: true, hasCatsDogsEquidae: true };
          assert.deepStrictEqual(data, expected, 'it should return severe protocols and cats as the reason');
        });
    });

    it('can return reasons why RA required when ASRU added', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.raAsru}/retrospective-assessments/reasons`)
        .expect(200)
        .expect(response => {
          const { data } = response.body;
          const expected = { addedByAsru: true };
          assert.deepStrictEqual(data, expected, 'it should return asru added as the reason');
        });
    });

    it('can return reasons why RA required when only present in earlier version', () => {
      return request(this.api)
        .get(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.raPreviousVersion}/retrospective-assessments/reasons`)
        .expect(200)
        .expect(response => {
          const { data } = response.body;
          const expected = { hasCatsDogsEquidae: true };
          assert.deepStrictEqual(data, expected, 'it should return cats as the reason');
        });
    });

  });

});
