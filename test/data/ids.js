const uuid = require('uuid/v4');

module.exports = {
  establishments: {
    croydon: 100,
    marvell: 101,
    cheese: 102,
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
    hasNoPil: uuid(),
    hasRevokedPil: uuid(),
    licensing: uuid(),
    marvellAdmin: uuid(),
    unverified: uuid(),
    aaProjectRemoved: uuid(),
    projectElsewhere: uuid(),
    activeAA: uuid()
  },
  roles: {
    nacwoClive: uuid(),
    nacwoNoddy: uuid()
  },
  pils: {
    linfordChristie: uuid(),
    noddyHolder: uuid(),
    cliveNacwo: uuid(),
    hasRevokedPil: uuid(),
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
      draftProjectWithMarvellAvailability: uuid(),
      expiredProject: uuid(),
      activeProject: uuid(),
      revokedProject: uuid(),
      asruInitiatedAmendment: uuid(),
      hasMarvellAvailability: uuid(),
      aaRemoved: uuid(),
      activeAA: uuid(),
      raSevere: uuid(),
      raMultiple: uuid(),
      raAsru: uuid(),
      raPreviousVersion: uuid(),
      notATransfer: uuid()
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
  rops: {
    draft: uuid(),
    submitted: uuid(),
    submitted2019: uuid()
  },
  procedures: {
    draft: uuid(),
    submitted: uuid()
  },
  versions: {
    testProject: uuid(),
    testLegacyProject: uuid(),
    testLegacyProject2: uuid(),
    nonRaProject: uuid(),
    raProject: uuid(),
    revokedRaProject: uuid(),
    notATransfer: uuid()
  },
  invitations: {
    basic: uuid(),
    admin: uuid()
  }
};
