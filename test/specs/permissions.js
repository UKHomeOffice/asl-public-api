const request = require('supertest');
const apiHelper = require('../helpers/api');
const ids = require('../data/ids');

describe('/permissions', () => {
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

  it('can delete permissions from users who hold roles at other establishments - regression', () => {
    return request(this.api)
      .delete(`/establishment/${ids.establishments.marvell}/profile/${ids.profiles.cliveNacwo}/permission`)
      .expect(200);
  });

  it('cannot remove permissions from a profile with an active project', () => {
    return request(this.api)
      .delete(`/establishment/${ids.establishments.croydon}/profile/${ids.profiles.projectElsewhere}/permission`)
      .expect(400);
  });

  it('can delete permissions from users who hold a project elsewhere', () => {
    return request(this.api)
      .delete(`/establishment/${ids.establishments.marvell}/profile/${ids.profiles.projectElsewhere}/permission`)
      .expect(200);
  });

  it('cannot delete permissions from users who hold a project with active aa', () => {
    return request(this.api)
      .delete(`/establishment/${ids.establishments.marvell}/profile/${ids.profiles.activeAA}/permission`)
      .expect(400);
  });

  it('can delete permissions from users who hold a project with removed aa', () => {
    return request(this.api)
      .delete(`/establishment/${ids.establishments.marvell}/profile/${ids.profiles.aaProjectRemoved}/permission`)
      .expect(200);
  });

});
