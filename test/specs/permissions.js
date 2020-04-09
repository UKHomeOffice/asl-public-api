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

});
