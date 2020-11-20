const express = require('express');

const makeDummyUser = user => (req, res, next) => {
  req.user = Object.assign({
    id: 'abc123',
    access_token: '12345',
    is: role => user.roles.includes(role),
    get: key => user[key],
    can: () => Promise.resolve({ json: {} }),
    allowedActions: () => Promise.resolve({}),
    _auth: {}
  }, user);
  next();
};

const WithUser = (app, user) => {
  const wrapper = express();
  wrapper.use(makeDummyUser(user));

  const staticRouter = express.Router();
  wrapper.use(staticRouter);
  wrapper.setUser = user => staticRouter.use(makeDummyUser(user));

  wrapper.use(app);
  wrapper.app = app;
  return wrapper;
};

module.exports = WithUser;
