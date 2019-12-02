const request = require('supertest');
const apiHelper = require('../helpers/api');

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
      .delete('/establishment/101/profile/a942ffc7-e7ca-4d76-a001-0b5048a057d9/permission')
      .expect(200);
  });

});
