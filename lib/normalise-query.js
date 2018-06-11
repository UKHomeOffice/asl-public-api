const { Op } = require('sequelize');

const mapKeyToOp = key => {
  return key.match(/^\$/) && Op[key.substr(1)] ? Op[key.substr(1)] : key;
};

const mapKeysToOps = obj => {
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
  req.where = mapKeysToOps(req.query);
  next();
};
