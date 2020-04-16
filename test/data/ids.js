const uuid = require('uuid/v4');

module.exports = {
  establishments: {
    croydon: 100,
    marvell: 101,
    inactiveEstablishment: 999,
    revokedEstablishment1: 1000,
    revokedEstablishment2: 1001
  },
  profiles: {
    linfordChristie: uuid(),
    noddyHolder: uuid(),
    cliveNacwo: uuid(),
    noddyNacwo: uuid(),
    multipleEstablishments: uuid(),
    vincentMalloy: uuid(),
    licensing: uuid()
  },
  pils: {
    linfordChristie: uuid(),
    noddyHolder: uuid(),
    cliveNacwo: uuid(),
    multipleEstablishments: uuid()
  },
  certificates: {
    linfordChristie: uuid()
  },
  places: {
    croydon101: uuid(),
    croydon102: uuid(),
    marvell101: uuid(),
    marvell102: uuid(),
    deleted: uuid()
  },
  projects: {
    croydon: {
      draftProject: uuid(),
      expiredProject: uuid(),
      activeProject: uuid(),
      revokedProject: uuid(),
      asruInitiatedAmendment: uuid()
    },
    marvell: {
      marvellProject: uuid(),
      testProject: uuid(),
      testLegacyProject: uuid(),
      nonRaProject: uuid(),
      raProject: uuid(),
      revokedRaProject: uuid()
    }
  },
  versions: {
    testProject: uuid(),
    testLegacyProject: uuid(),
    testLegacyProject2: uuid(),
    nonRaProject: uuid(),
    raProject: uuid(),
    revokedRaProject: uuid()
  },
  invitations: {
    basic: uuid(),
    admin: uuid()
  }
};