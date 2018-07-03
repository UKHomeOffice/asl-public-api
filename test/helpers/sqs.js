const sinon = require('sinon');
const AWS = require('aws-sdk');

module.exports = () => {

  const mock = {
    messages: [],
    teardown: () => {
      AWS.SQS.restore();
    }
  };

  sinon.stub(AWS, 'SQS').returns({
    sendMessage: (params, cb) => {
      mock.messages.push({ ...params, MessageBody: JSON.parse(params.MessageBody) });
      setImmediate(() => cb(null, {}));
    }
  });

  return mock;

};
