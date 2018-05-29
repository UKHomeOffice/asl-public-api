const express = require('express');
const { can } = require('@asl/service/lib/permissions');

const makeDummyUser = user => (req, res, next) => {
  req.user = Object.assign({
    id: 1,
    access_token: '12345',
    is: role => user.roles.includes(role),
    get: key => user[key]
  }, user);
  req.user.can = (task, params) => can(req.user, task, params);
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
