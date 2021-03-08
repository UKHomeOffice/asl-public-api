const Schema = require('@asl/schema');

module.exports = settings => {

  return {
    init: (populate) => {
      const schema = Schema(settings);
      const tables = [
        'TrainingPil',
        'TrainingCourse',
        'AsruEstablishment',
        'ProjectEstablishment',
        'ProjectProfile',
        'RetrospectiveAssessment',
        'Procedure',
        'Rop',
        'ProjectVersion',
        'Project',
        'Permission',
        'Authorisation',
        'FeeWaiver',
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
        return p.then(() => {
          if (schema[table].queryWithDeleted) {
            return schema[table].queryWithDeleted().hardDelete();
          }
          return schema[table].query().delete();
        });
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
