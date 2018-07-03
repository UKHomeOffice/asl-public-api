const assert = require('assert');

const Client = require('../../lib/queue/client');
const SQS = require('../helpers/sqs');

describe('SQS Client', () => {

  beforeEach(() => {
    this.sqs = SQS();
  });

  afterEach(() => {
    this.sqs.teardown();
  });

  describe('validation', () => {

    it('rejects if no model is defined', () => {
      const queue = Client({});
      return queue({ action: 'create', user: 'abc123' })
        .then(() => {
          assert(false, 'promise should not resolve');
        }, err => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('model'));
        });
    });

    it('rejects if no action is defined', () => {
      const queue = Client({});
      return queue({ model: 'place', user: 'abc123' })
        .then(() => {
          assert(false, 'promise should not resolve');
        }, err => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('action'));
        });
    });

    it('rejects if no user is defined', () => {
      const queue = Client({});
      return queue({ model: 'place', action: 'create' })
        .then(() => {
          assert(false, 'promise should not resolve');
        }, err => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('user'));
        });
    });

    it('rejects if no id is defined for update actions', () => {
      const queue = Client({});
      return queue({ model: 'place', action: 'update', user: 'abc123' })
        .then(() => {
          assert(false, 'promise should not resolve');
        }, err => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('id'));
        });
    });

    it('rejects if no id is defined for delete actions', () => {
      const queue = Client({});
      return queue({ model: 'place', action: 'delete', user: 'abc123' })
        .then(() => {
          assert(false, 'promise should not resolve');
        }, err => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('id'));
        });
    });

    it('rejects if no data is defined for update actions', () => {
      const queue = Client({});
      return queue({ model: 'place', action: 'update', user: 'abc123', id: 'abc123' })
        .then(() => {
          assert(false, 'promise should not resolve');
        }, err => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('data'));
        });
    });

    it('rejects if no data is defined for create actions', () => {
      const queue = Client({});
      return queue({ model: 'place', action: 'create', user: 'abc123' })
        .then(() => {
          assert(false, 'promise should not resolve');
        }, err => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('data'));
        });
    });

  });

  it('pushes a message to SQS', () => {
    const inputs = { model: 'place', action: 'create', user: 'abc123', data: { comment: 'Hello' } };
    const queue = Client({ url: 'http://sqs.url' });
    return queue(inputs)
      .then(() => {
        assert.equal(this.sqs.messages.length, 1);
        const msg = this.sqs.messages[0];
        assert.equal(msg.QueueUrl, 'http://sqs.url');
        assert.deepEqual(msg.MessageBody, inputs);
      });
  });

});