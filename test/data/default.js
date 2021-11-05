const uuid = require('uuid/v4');
const moment = require('moment');
const ids = require('./ids');

module.exports = models => {

  return Promise.resolve()
    .then(() => models.Profile.query().insert([
      {
        id: ids.profiles.linfordChristie,
        userId: 'abc123',
        title: 'Dr',
        firstName: 'Linford',
        lastName: 'Christie',
        address: '1 Some Road',
        postcode: 'A1 1AA',
        email: 'test1@example.com',
        telephone: '01234567890',
        pilLicenceNumber: 'AB-123',
        emailConfirmed: true
      },
      {
        id: ids.profiles.noddyHolder,
        userId: 'basic',
        title: 'Dr',
        firstName: 'Noddy',
        lastName: 'Holder',
        address: '1 Some Road',
        postcode: 'A1 1AA',
        email: 'test2@example.com',
        telephone: '01234567890',
        pilLicenceNumber: 'D-456',
        emailConfirmed: true
      },
      {
        id: ids.profiles.cliveNacwo,
        userId: 'nacwo',
        title: 'Dr',
        firstName: 'Clive',
        lastName: 'Nacwo',
        address: '1 Some Road',
        postcode: 'A1 1AA',
        email: 'test3@example.com',
        telephone: '01234567890',
        pilLicenceNumber: 'F-789',
        emailConfirmed: true
      },
      {
        id: ids.profiles.noddyNacwo,
        title: 'Dr',
        firstName: 'Noddy',
        lastName: 'Nacwo',
        address: '1 Some Road',
        postcode: 'A1 1AA',
        email: 'test4@example.com',
        telephone: '01234567890',
        emailConfirmed: true
      },
      {
        id: ids.profiles.multipleEstablishments,
        userId: 'multi-establishment',
        title: 'Professor',
        firstName: 'Colin',
        lastName: 'Jackson',
        address: '1 Some Road',
        postcode: 'A1 1AA',
        email: 'test5@example.com',
        telephone: '01234567890',
        pilLicenceNumber: 'C-987',
        emailConfirmed: true
      },
      {
        id: ids.profiles.vincentMalloy,
        title: 'Mr',
        firstName: 'Vincent',
        lastName: 'Malloy',
        address: '1 Some Road',
        postcode: 'A1 1AA',
        email: 'vincent@malloy.com',
        telephone: '01234567890',
        emailConfirmed: true
      },
      {
        id: ids.profiles.hasNoPil,
        title: 'Mr',
        firstName: 'Hasnø',
        lastName: 'PIL',
        email: 'hasnopil@example.com',
        emailConfirmed: true
      },
      {
        id: ids.profiles.hasRevokedPil,
        userId: 'hasRevokedPil',
        title: 'Mr',
        firstName: 'Has-Revoked',
        lastName: 'PIL',
        email: 'hasrevokedpil@example.com',
        emailConfirmed: true
      },
      {
        id: ids.profiles.marvellAdmin,
        userId: 'marvellAdmin',
        title: 'Mr',
        firstName: 'Ben',
        lastName: 'Marvell',
        email: 'ibuiltmyownhouse@anditfelldown.com',
        emailConfirmed: true
      },
      {
        id: ids.profiles.unverified,
        userId: 'unverified',
        title: 'Mr',
        firstName: 'Edward',
        lastName: 'Meat',
        email: 'unknown@example.com',
        emailConfirmed: false
      },
      {
        id: ids.profiles.projectElsewhere,
        title: 'Mr',
        firstName: 'Project',
        lastName: 'Elsewhere',
        email: 'projelsewhere@example.com',
        emailConfirmed: true
      },
      {
        id: ids.profiles.aaProjectRemoved,
        title: 'Mr',
        firstName: 'AA',
        lastName: 'removed',
        email: 'aaremoved@example.com',
        emailConfirmed: true
      },
      {
        id: ids.profiles.activeAA,
        title: 'Mr',
        firstName: 'AA',
        lastName: 'active0',
        email: 'aaactive@example.com',
        emailConfirmed: true
      }
    ]))
    .then(() => models.Profile.query().insert([
      {
        id: ids.profiles.licensing,
        userId: 'licensing',
        firstName: 'Li Sen',
        lastName: 'Xing',
        email: 'lisenxing@example.com',
        asruUser: true,
        asruLicensing: true
      }
    ]))
    .then(() => models.Certificate.query().insert([
      {
        id: ids.certificates.linfordChristie,
        profileId: ids.profiles.linfordChristie
      }
    ]))
    .then(() => models.Establishment.query().insert([
      {
        id: ids.establishments.croydon,
        issueDate: '2018-01-01T12:00:00Z',
        name: 'University of Croydon',
        country: 'england',
        address: '100 High Street',
        email: 'test@example.com'
      },
      {
        id: ids.establishments.marvell,
        issueDate: '2020-07-01T12:00:00Z',
        name: 'Marvell Pharmaceuticals',
        country: 'england',
        address: '101 High Street',
        email: 'test@example.com'
      },
      {
        id: ids.establishments.inactiveEstablishment,
        name: 'Invisible Pharma'
      },
      {
        id: ids.establishments.revokedEstablishment1,
        name: 'Invisible Pharma 2',
        issueDate: '2017-01-01T12:00:00Z',
        revocationDate: '2019-01-01T12:00:00Z',
        status: 'revoked'
      },
      {
        id: ids.establishments.revokedEstablishment2,
        name: 'Invisible Pharma 3',
        issueDate: '2017-01-01T12:00:00Z',
        revocationDate: '2020-07-01T12:00:00Z',
        status: 'revoked'
      }
    ]))
    .then(() => models.Place.query().insert([
      {
        id: ids.places.croydon101,
        establishmentId: ids.establishments.croydon,
        site: 'Lunar House',
        name: 'Room 101',
        suitability: ['SA', 'LA'],
        holding: ['LTH']
      },
      {
        id: ids.places.croydon102,
        establishmentId: ids.establishments.croydon,
        site: 'Lunar House',
        name: 'Room 102',
        suitability: ['SA'],
        holding: ['STH']
      },
      {
        id: ids.places.deleted,
        establishmentId: ids.establishments.croydon,
        site: 'Lunar House',
        name: 'Deleted room',
        suitability: ['SA'],
        holding: ['STH'],
        deleted: '2018-01-01T14:00:00Z'
      },
      {
        id: ids.places.marvell101,
        establishmentId: ids.establishments.marvell,
        site: 'Apollo House',
        name: 'Room 101',
        suitability: ['SA'],
        holding: ['LTH']
      },
      {
        id: ids.places.marvell102,
        establishmentId: ids.establishments.marvell,
        site: 'Apollo House',
        name: 'Room 102',
        suitability: ['SA'],
        holding: ['STH']
      }
    ]))
    .then(() => models.Project.query().insert([
      {
        id: ids.projects.croydon.draftProject,
        establishmentId: ids.establishments.croydon,
        title: 'Draft project',
        schemaVersion: 1,
        licenceHolderId: ids.profiles.linfordChristie,
        expiryDate: '2040-01-01T12:00:00Z',
        licenceNumber: 'abc123',
        status: 'inactive'
      },
      {
        id: ids.projects.croydon.expiredProject,
        establishmentId: ids.establishments.croydon,
        title: 'Expired project',
        schemaVersion: 1,
        licenceHolderId: ids.profiles.linfordChristie,
        expiryDate: '2010-01-01T12:00:00Z',
        licenceNumber: 'abc456',
        status: 'expired'
      },
      {
        id: ids.projects.croydon.activeProject,
        establishmentId: ids.establishments.croydon,
        title: 'Active project',
        schemaVersion: 1,
        licenceHolderId: ids.profiles.linfordChristie,
        expiryDate: '2040-01-01T12:00:00Z',
        licenceNumber: 'abc111',
        status: 'active'
      },
      {
        id: ids.projects.croydon.revokedProject,
        establishmentId: ids.establishments.croydon,
        title: 'Revoked project',
        schemaVersion: 1,
        licenceHolderId: ids.profiles.linfordChristie,
        expiryDate: '2030-01-01T12:00:00Z',
        licenceNumber: 'abc000',
        status: 'revoked'
      },
      {
        id: ids.projects.marvell.marvellProject,
        establishmentId: ids.establishments.marvell,
        title: 'Test project 2',
        schemaVersion: 1,
        licenceHolderId: ids.profiles.vincentMalloy,
        expiryDate: '2040-01-01T12:00:00Z',
        licenceNumber: 'abc789',
        status: 'inactive'
      },
      {
        id: ids.projects.marvell.testProject,
        establishmentId: ids.establishments.marvell,
        title: 'Test project',
        status: 'inactive',
        expiryDate: null,
        revocationDate: null,
        schemaVersion: 1
      },
      {
        id: ids.projects.marvell.testLegacyProject,
        establishmentId: ids.establishments.marvell,
        title: 'Test legacy project',
        status: 'inactive',
        expiryDate: null,
        revocationDate: null,
        schemaVersion: 0
      },
      {
        id: ids.projects.marvell.nonRaProject,
        establishmentId: ids.establishments.marvell,
        title: 'Non-RA project',
        status: 'active',
        expiryDate: '2025-01-01T12:00:00Z',
        revocationDate: null,
        schemaVersion: 0
      },
      {
        id: ids.projects.marvell.raProject,
        establishmentId: ids.establishments.marvell,
        title: 'RA project',
        status: 'active',
        expiryDate: '2025-01-01T12:00:00Z',
        revocationDate: null,
        schemaVersion: 0
      },
      {
        id: ids.projects.marvell.revokedRaProject,
        establishmentId: ids.establishments.marvell,
        title: 'Revoked RA project',
        status: 'revoked',
        expiryDate: '2025-01-01T12:00:00Z',
        revocationDate: '2024-01-01T12:00:00Z',
        schemaVersion: 0
      },
      {
        id: ids.projects.croydon.hasMarvellAvailability,
        establishmentId: ids.establishments.croydon,
        title: 'Has Marvell Availability',
        status: 'active',
        expiryDate: '2025-01-01T12:00:00Z',
        licenceNumber: 'abc321',
        schemaVersion: 1
      },
      {
        id: ids.projects.croydon.draftProjectWithMarvellAvailability,
        establishmentId: ids.establishments.croydon,
        title: 'Draft Has Marvell Availability',
        status: 'inactive',
        schemaVersion: 1
      },
      {
        id: uuid(),
        establishmentId: ids.establishments.croydon,
        title: 'Project elsewhere',
        status: 'active',
        schemaVersion: 1,
        expiryDate: '2040-01-01T12:00:00Z',
        licenceNumber: 'abc000',
        licenceHolderId: ids.profiles.projectElsewhere
      },
      {
        id: ids.projects.croydon.aaRemoved,
        establishmentId: ids.establishments.croydon,
        title: 'Project elsewhere',
        status: 'active',
        schemaVersion: 1,
        expiryDate: '2040-01-01T12:00:00Z',
        licenceNumber: 'abc000',
        licenceHolderId: ids.profiles.aaProjectRemoved
      },
      {
        id: ids.projects.croydon.activeAA,
        establishmentId: ids.establishments.croydon,
        title: 'Active AA',
        status: 'active',
        schemaVersion: 1,
        issueDate: '2020-02-10T12:00:00Z',
        expiryDate: '2040-01-01T12:00:00Z',
        licenceNumber: 'abc000',
        licenceHolderId: ids.profiles.activeAA
      },
      {
        id: ids.projects.croydon.notATransfer,
        establishmentId: ids.establishments.croydon,
        title: 'Not a transfer',
        status: 'active',
        schemaVersion: 1,
        issueDate: '2020-02-10T12:00:00Z',
        expiryDate: '2040-01-01T12:00:00Z',
        licenceNumber: 'abc000',
        licenceHolderId: ids.profiles.linfordChristie
      }
    ]))
    .then(() => models.Project.query().insert([
      {
        id: ids.projects.croydon.asruInitiatedAmendment,
        establishmentId: ids.establishments.croydon,
        title: 'Asru initiated amendment',
        status: 'active',
        schemaVersion: 1,
        createdAt: '2019-09-04T13:32:45.886Z',
        issueDate: '2019-04-23T00:00:00.000Z',
        updatedAt: '2019-09-04T13:32:45.886Z',
        expiryDate: '2024-04-23T00:00:00.000Z'
      }
    ]))
    .then(() => models.Rop.query().insert([
      {
        id: ids.rops.draft,
        projectId: ids.projects.croydon.activeAA,
        status: 'draft',
        year: 2021
      },
      {
        id: ids.rops.submitted,
        projectId: ids.projects.croydon.activeAA,
        status: 'submitted',
        year: 2020,
        submittedDate: '2021-01-19T12:00:00.000Z'
      }
    ]))
    .then(() => models.Procedure.query().insert([
      {
        id: ids.procedures.submitted,
        ropId: ids.rops.submitted,
        species: 'mice',
        ga: 'no-ga',
        purposes: 'basic',
        newGeneticLine: false,
        severity: 'severe',
        severityNum: 123
      },
      {
        id: ids.procedures.draft,
        ropId: ids.rops.draft,
        species: 'mice',
        ga: 'no-ga',
        purposes: 'basic',
        newGeneticLine: false,
        severity: 'severe',
        severityNum: 123
      }
    ]))
    .then(() => models.ProjectVersion.query().insert([
      {
        id: uuid(),
        projectId: ids.projects.croydon.activeProject,
        status: 'draft',
        data: {}
      },
      {
        id: uuid(),
        projectId: ids.projects.croydon.activeAA,
        status: 'granted',
        data: {}
      },
      {
        id: ids.versions.testProject,
        projectId: ids.projects.marvell.testProject,
        status: 'submitted',
        data: {
          protocols: [
            {
              species: [
                {
                  geneticallyAltered: true
                }
              ]
            }
          ]
        }
      },
      {
        id: ids.versions.testLegacyProject,
        projectId: ids.projects.marvell.testLegacyProject,
        status: 'submitted',
        data: {
          protocols: [
            {
              species: [
                {
                  'genetically-altered': true,
                  lifeStage: 'Adult'
                },
                {
                  geneticallyAltered: true,
                  'genetically-altered': false,
                  lifeStage: 'Adult'
                }
              ]
            },
            {
              species: [
                {
                  geneticallyAltered: true,
                  'life-stages': 'Embryo',
                  lifeStage: 'Adult'
                }
              ]
            }
          ]
        }
      },
      {
        id: ids.versions.testLegacyProject2,
        projectId: ids.projects.marvell.testLegacyProject,
        status: 'submitted',
        data: {
          conditions: [
            {
              key: 'custom',
              edited: 'This is a custom condition'
            }
          ]
        }
      },
      {
        id: ids.versions.nonRaProject,
        projectId: ids.projects.marvell.nonRaProject,
        status: 'granted',
        data: {}
      },
      {
        id: ids.versions.raProject,
        projectId: ids.projects.marvell.raProject,
        status: 'granted',
        data: {
          retrospectiveAssessment: true
        }
      },
      {
        id: ids.versions.revokedRaProject,
        projectId: ids.projects.marvell.revokedRaProject,
        status: 'granted',
        data: {
          species: [
            'marmosets'
          ]
        }
      },
      {
        id: uuid(),
        projectId: ids.projects.croydon.hasMarvellAvailability,
        status: 'granted'
      },
      {
        id: uuid(),
        projectId: ids.projects.croydon.draftProjectWithMarvellAvailability,
        status: 'draft'
      },
      {
        id: ids.versions.notATransfer,
        projectId: ids.projects.croydon.notATransfer,
        status: 'draft',
        data: {
          transferToEstablishment: ids.establishments.croydon,
          transferToEstablishmentName: 'University of Croydon'
        }
      }
    ]))
    .then(() => models.ProjectVersion.query().insert([
      {
        projectId: ids.projects.croydon.asruInitiatedAmendment,
        status: 'granted',
        createdAt: '2019-09-04T13:32:45.886Z',
        updatedAt: '2019-09-04T13:32:45.886Z',
        asruVersion: false
      },
      {
        projectId: ids.projects.croydon.asruInitiatedAmendment,
        status: 'draft',
        createdAt: '2019-09-05T13:32:45.886Z',
        updatedAt: '2019-09-05T13:32:45.886Z',
        asruVersion: true
      },
      {
        projectId: ids.projects.croydon.asruInitiatedAmendment,
        status: 'draft',
        createdAt: '2019-09-06T13:32:45.886Z',
        updatedAt: '2019-09-06T13:32:45.886Z',
        asruVersion: true
      }
    ]))
    .then(() => models.ProjectEstablishment.query().insert([
      {
        projectId: ids.projects.croydon.hasMarvellAvailability,
        establishmentId: ids.establishments.marvell,
        status: 'active',
        issueDate: moment().toISOString()
      },
      {
        projectId: ids.projects.croydon.draftProjectWithMarvellAvailability,
        establishmentId: ids.establishments.marvell,
        status: 'draft'
      },
      {
        projectId: ids.projects.croydon.aaRemoved,
        establishmentId: ids.establishments.marvell,
        status: 'removed'
      },
      {
        projectId: ids.projects.croydon.activeAA,
        establishmentId: ids.establishments.marvell,
        status: 'active'
      }
    ]))
    .then(() => models.Permission.query().insert([
      {
        profileId: ids.profiles.linfordChristie,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.noddyHolder,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.cliveNacwo,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.noddyNacwo,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.multipleEstablishments,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.marvellAdmin,
        establishmentId: ids.establishments.marvell,
        role: 'admin'
      },
      {
        profileId: ids.profiles.multipleEstablishments,
        establishmentId: ids.establishments.marvell,
        role: 'basic'
      },
      {
        profileId: ids.profiles.vincentMalloy,
        establishmentId: ids.establishments.marvell,
        role: 'basic'
      },
      {
        profileId: ids.profiles.cliveNacwo,
        establishmentId: ids.establishments.marvell,
        role: 'basic'
      },
      {
        profileId: ids.profiles.hasNoPil,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.hasRevokedPil,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.aaProjectRemoved,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.aaProjectRemoved,
        establishmentId: ids.establishments.marvell,
        role: 'basic'
      },
      {
        profileId: ids.profiles.projectElsewhere,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.projectElsewhere,
        establishmentId: ids.establishments.marvell,
        role: 'basic'
      },
      {
        profileId: ids.profiles.activeAA,
        establishmentId: ids.establishments.croydon,
        role: 'basic'
      },
      {
        profileId: ids.profiles.activeAA,
        establishmentId: ids.establishments.marvell,
        role: 'basic'
      }
    // permissions does not have an id column
    ]).returning('*'))
    .then(() => models.Role.query().insert([
      {
        id: uuid(),
        type: 'pelh',
        profileId: ids.profiles.multipleEstablishments,
        establishmentId: ids.establishments.croydon
      },
      {
        id: ids.roles.nacwoClive,
        type: 'nacwo',
        profileId: ids.profiles.cliveNacwo,
        establishmentId: ids.establishments.croydon
      },
      {
        id: ids.roles.nacwoNoddy,
        type: 'nacwo',
        profileId: ids.profiles.noddyNacwo,
        establishmentId: ids.establishments.croydon
      },
      {
        id: uuid(),
        type: 'pelh',
        profileId: ids.profiles.multipleEstablishments,
        establishmentId: ids.establishments.marvell
      }
    ]))
    .then(() => models.PIL.query().insert([
      {
        id: ids.pils.linfordChristie,
        profileId: ids.profiles.linfordChristie,
        establishmentId: ids.establishments.croydon,
        status: 'active',
        issueDate: '2016-01-01T12:00:00Z',
        revocationDate: null,
        procedures: ['A', 'B'],
        updatedAt: '2020-01-01T12:00:00Z'
      },
      {
        id: ids.pils.noddyHolder,
        profileId: ids.profiles.noddyHolder,
        establishmentId: ids.establishments.croydon,
        status: 'active',
        issueDate: '2016-01-01T12:00:00Z',
        revocationDate: null,
        procedures: ['D'],
        notesCatD: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        updatedAt: '2020-01-01T12:00:00Z'
      },
      {
        id: ids.pils.cliveNacwo,
        profileId: ids.profiles.cliveNacwo,
        establishmentId: ids.establishments.croydon,
        status: 'active',
        issueDate: '2016-01-01T12:00:00Z',
        revocationDate: null,
        procedures: ['F'],
        notesCatF: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        updatedAt: '2020-01-01T12:00:00Z',
        reviewDate: moment().subtract(1, 'month').toISOString()
      },
      {
        id: ids.pils.multipleEstablishments,
        profileId: ids.profiles.multipleEstablishments, // Colin is at both establishments
        establishmentId: ids.establishments.croydon,
        status: 'active',
        issueDate: '2016-01-01T12:00:00Z',
        revocationDate: '2015-12-01T12:00:00Z',
        procedures: ['C'],
        species: ['Mice', 'Rats'],
        updatedAt: '2020-01-01T12:00:00Z',
        reviewDate: '2024-12-01T12:00:00Z'
      },
      {
        id: ids.pils.hasRevokedPil,
        profileId: ids.profiles.hasRevokedPil,
        establishmentId: ids.establishments.croydon,
        status: 'revoked',
        issueDate: '2015-01-01T12:00:00Z',
        revocationDate: '2016-12-01T12:00:00Z',
        procedures: ['C'],
        species: ['Mice', 'Rats'],
        updatedAt: '2016-01-01T12:00:00Z',
        reviewDate: '2021-01-01T12:00:00Z'
      }
    ]))
    .then(() => models.PilTransfer.query().insert([
      {
        pilId: ids.pils.linfordChristie,
        fromEstablishmentId: ids.establishments.marvell,
        toEstablishmentId: ids.establishments.croydon,
        createdAt: '2020-01-01T12:00:00Z'
      }
    ]))
    .then(() => models.Invitation.query().insert([
      {
        id: ids.invitations.basic,
        // test that case does not have to match profile.email
        email: 'TEST1@example.com',
        establishmentId: ids.establishments.marvell,
        role: 'basic',
        token: 'abcdef'
      },
      {
        id: ids.invitations.admin,
        email: 'test2@example.com',
        establishmentId: ids.establishments.marvell,
        role: 'admin',
        token: 'abcdef'
      }
    ]))
    .then(() => models.PlaceRole.query().insert([
      {
        placeId: ids.places.croydon101,
        roleId: ids.roles.nacwoClive
      }
    ]));
};
