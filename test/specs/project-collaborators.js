const assert = require('assert');
const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('Project collaborators', () => {
  beforeEach(() => {
    return apiHelper.create()
      .then((api) => {
        this.api = api.api;
        this.workflow = api.workflow;
      });
  });

  afterEach(() => {
    return apiHelper.destroy();
  });

  it('can add a collaborator from own establishment to own est project', () => {
    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.activeProject}/collaborators/${ids.profiles.noddyHolder}`)
      .expect(200)
      .expect(() => {
        assert.equal(this.workflow.handler.callCount, 1);
        const req = this.workflow.handler.firstCall.args[0];
        const body = req.body;
        assert.equal(req.method, 'POST');
        assert.equal(body.model, 'projectProfile');
        assert.equal(body.action, 'create');
        assert.equal(body.establishmentId, ids.establishments.croydon);
        assert.deepEqual(body.data, { profileId: ids.profiles.noddyHolder, projectId: ids.projects.croydon.activeProject });
      });
  });

  it('can add a collaborator from an additional establishment', () => {
    this.api.setUser({ id: 'marvellAdmin' });
    return request(this.api)
      .post(`/establishment/${ids.establishments.marvell}/projects/${ids.projects.croydon.hasMarvellAvailability}/collaborators/${ids.profiles.vincentMalloy}`)
      .expect(200);
  });

  it('cannot be added as collab if no additional availability', () => {
    return request(this.api)
      .post(`/establishment/${ids.establishments.marvell}/projects/${ids.projects.croydon.activeProject}/collaborators/${ids.profiles.vincentMalloy}`)
      .expect(404)
      .expect(response => {
        const err = response.body;
        assert.equal(err.message, 'Not found');
      });
  });

  it('cannot be added as collab if no additional availability', () => {
    return request(this.api)
      .post(`/establishment/${ids.establishments.croydon}/projects/${ids.projects.croydon.activeProject}/collaborators/${ids.profiles.vincentMalloy}`)
      .expect(400)
      .expect(response => {
        const err = response.body;
        assert.equal(err.message, 'User is not associated with project establishment');
      });
  });

  it('can add a collab to a draft project if has draft addtional availability', () => {
    return request(this.api)
      .post(`/establishment/${ids.establishments.marvell}/projects/${ids.projects.croydon.draftProjectWithMarvellAvailability}/collaborators/${ids.profiles.vincentMalloy}`)
      .expect(200);
  });

  it('cannot add a collab to a draft project without additional availability', () => {
    return request(this.api)
      .post(`/establishment/${ids.establishments.marvell}/projects/${ids.projects.croydon.draftProject}/collaborators/${ids.profiles.vincentMalloy}`)
      .expect(404);
  });
});
