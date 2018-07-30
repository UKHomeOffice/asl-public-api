const { omit, flatten, remove } = require('lodash');
const { Op } = require('sequelize');

const mapKeyToOp = key => {
  return key.match(/^\$/) && Op[key.substr(1)] ? Op[key.substr(1)] : key;
};

const mapKeysToOps = obj => {
  if (Array.isArray(obj)) {
    return obj.map(mapKeysToOps);
  }
  if (typeof obj !== 'object') {
    return obj;
  }

  return Object.keys(obj)
    .reduce((out, key) => {
      return Object.assign(out, {
        [mapKeyToOp(key)]: mapKeysToOps(obj[key])
      });
    }, {});
};

module.exports = () => (req, res, next) => {
  req.where = mapKeysToOps(omit(req.query, ['limit', 'offset', 'sort', 'search']));
  next();
};
