const sinon = require('sinon');
const assert = require('assert');
const fetch = require('../../../lib/middleware/fetch-open-tasks');

describe('Open tasks middleware', () => {

  it('does not mutate getId parameter', () => {

    const req = {
      workflow: {
        openTasks: sinon.stub().resolves({ json: { data: [] } })
      }
    };

    const middleware = fetch(req => req.id);
    middleware({ ...req, id: 1 }, {}, () => null);
    middleware({ ...req, id: 2 }, {}, () => null);

    assert.ok(req.workflow.openTasks.calledWith(1));
    assert.ok(req.workflow.openTasks.calledWith(2));

  });

});
