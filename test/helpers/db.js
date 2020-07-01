const Schema = require('@asl/schema');

module.exports = settings => {

  return {
    init: (populate) => {
      const schema = Schema(settings);
      const tables = [
        'AsruEstablishment',
        'ProjectVersion',
        'Project',
        'Permission',
        'Authorisation',
        'PilTransfer',
        'PIL',
        'PlaceRole',
        'Place',
        'Role',
        'Exemption',
        'Certificate',
        'Profile',
        'Invitation',
        'Establishment'
      ];
      return tables.reduce((p, table) => {
        return p.then(() => schema[table].queryWithDeleted().hardDelete());
      }, Promise.resolve())
        .then(() => populate && populate(schema))
        .then(() => schema.destroy())
        .catch(err => {
          schema.destroy();
          throw err;
        });
    }
  };

};
