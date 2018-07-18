const { omit, flatten } = require('lodash');
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
  if (req.query.sort) {
    req.order = [
      // column can be a String column name or Array path for nested columns
      // ['modelName', 'columnName']
      flatten([req.query.sort.column, req.query.sort.ascending === 'true' ? 'ASC' : 'DESC'])
    ];
  }
  next();
};
