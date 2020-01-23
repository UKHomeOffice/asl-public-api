module.exports = models => {

  const { Establishment, Profile, PIL, Invitation, Project, ProjectVersion } = models;

  return Promise.resolve()
    .then(() => {
      return Profile.query().insertGraph([
        {
          id: 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9',
          userId: 'abc123',
          title: 'Dr',
          firstName: 'Linford',
          lastName: 'Christie',
          address: '1 Some Road',
          postcode: 'A1 1AA',
          email: 'test1@example.com',
          telephone: '01234567890',
          certificates: [
            {
              id: 'c3032cc0-7dc7-40bc-be7e-97edc4ea1072'
            }
          ]
        },
        {
          id: 'b2b8315b-82c0-4b2d-bc13-eb13e605ee88',
          userId: 'basic',
          title: 'Dr',
          firstName: 'Noddy',
          lastName: 'Holder',
          address: '1 Some Road',
          postcode: 'A1 1AA',
          email: 'test2@example.com',
          telephone: '01234567890'
        },
        {
          id: 'a942ffc7-e7ca-4d76-a001-0b5048a057d9',
          title: 'Dr',
          firstName: 'Clive',
          lastName: 'Nacwo',
          address: '1 Some Road',
          postcode: 'A1 1AA',
          email: 'test3@example.com',
          telephone: '01234567890'
        },
        {
          id: 'a942ffc7-e7ca-4d76-a001-0b5048a057d0',
          title: 'Dr',
          firstName: 'Noddy',
          lastName: 'Nacwo',
          address: '1 Some Road',
          postcode: 'A1 1AA',
          email: 'test4@example.com',
          telephone: '01234567890'
        },
        {
          id: 'ae28fb31-d867-4371-9b4f-79019e71232f',
          userId: 'multi-establishment',
          title: 'Professor',
          firstName: 'Colin',
          lastName: 'Jackson',
          address: '1 Some Road',
          postcode: 'A1 1AA',
          email: 'test5@example.com',
          telephone: '01234567890'
        },
        {
          id: 'ae28fb31-d867-4371-9b4f-79019e71232e',
          title: 'Mr',
          firstName: 'Vincent',
          lastName: 'Malloy',
          address: '1 Some Road',
          postcode: 'A1 1AA',
          email: 'vincent@malloy.com',
          telephone: '01234567890'
        }
      ])
        .then(() => {
          return Profile.query().insertGraph([
            {
              id: 'a942ffc7-e7ca-4d76-a001-0b5048a057d2',
              userId: 'licensing',
              firstName: 'Li Sen',
              lastName: 'Xing',
              email: 'lisenxing@example.com',
              asruUser: true,
              asruLicensing: true,
              asruInspector: false,
              asruAdmin: false
            }
          ]);
        })
        .then(() => {
          return Establishment.query().insertGraph([{
            id: 100,
            issueDate: '2018-01-01T12:00:00Z',
            name: 'University of Croydon',
            country: 'england',
            address: '100 High Street',
            email: 'test@example.com',
            places: [
              {
                id: '1d6c5bb4-be60-40fd-97a8-b29ffaa2135f',
                site: 'Lunar House',
                name: 'Room 101',
                suitability: ['SA', 'LA'],
                holding: ['LTH']
              },
              {
                id: '2f404b2f-656f-4cc3-b432-5aadad052fc8',
                site: 'Lunar House',
                name: 'Room 102',
                suitability: ['SA'],
                holding: ['STH']
              },
              {
                id: 'a50331bb-c1d0-4068-87ca-b5a41143b0d0',
                site: 'Lunar House',
                name: 'Deleted room',
                suitability: ['SA'],
                holding: ['STH'],
                deleted: '2018-01-01T14:00:00Z'
              }
            ],
            projects: [
              {
                id: 'bf22f7cd-cf85-42ef-93da-02b709df67be',
                title: 'Draft project',
                licenceHolderId: 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9',
                expiryDate: '2040-01-01T12:00:00Z',
                licenceNumber: 'abc123',
                status: 'inactive'
              },
              {
                id: '33628b46-da08-4e60-9b15-b031f5000f0c',
                title: 'Expired project',
                licenceHolderId: 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9',
                expiryDate: '2010-01-01T12:00:00Z',
                licenceNumber: 'abc456',
                status: 'expired'
              },
              {
                id: 'd2f9777d-2d9d-4ea2-a9c2-c5ed592fd98d',
                title: 'Active project',
                licenceHolderId: 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9',
                expiryDate: '2040-01-01T12:00:00Z',
                licenceNumber: 'abc111',
                status: 'active',
                version: [
                  {
                    status: 'draft',
                    data: {}
                  }
                ]
              },
              {
                id: '3d112756-5d0b-4303-838e-34046aa98e30',
                title: 'Revoked project',
                licenceHolderId: 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9',
                expiryDate: '2030-01-01T12:00:00Z',
                licenceNumber: 'abc000',
                status: 'revoked'
              }
            ]
          },
          {
            id: 101,
            issueDate: '2020-01-01T12:00:00Z',
            name: 'Marvell Pharmaceuticals',
            country: 'england',
            address: '101 High Street',
            email: 'test@example.com',
            places: [
              {
                id: 'e859d43a-e8ab-4ae6-844a-95c978082a48',
                site: 'Apollo House',
                name: 'Room 101',
                suitability: ['SA'],
                holding: ['LTH']
              },
              {
                id: '4c9f9921-92ad-465c-8f94-06f05fcb7736',
                site: 'Apollo House',
                name: 'Room 102',
                suitability: ['SA'],
                holding: ['STH']
              }
            ],
            projects: [
              {
                id: '4f76232a-7794-45da-a0ef-c7eafc15fa1e',
                title: 'Test project 2',
                licenceHolderId: 'ae28fb31-d867-4371-9b4f-79019e71232e',
                expiryDate: '2040-01-01T12:00:00Z',
                licenceNumber: 'abc789'
              }
            ]
          },
          {
            id: 999,
            name: 'Invisible Pharma'
          },
          {
            id: 1000,
            name: 'Invisible Pharma 2',
            issueDate: '2017-01-01T12:00:00Z',
            revocationDate: '2018-01-01T12:00:00Z',
            status: 'revoked'
          },
          {
            id: 1001,
            name: 'Invisible Pharma 3',
            issueDate: '2017-01-01T12:00:00Z',
            revocationDate: '2020-01-01T12:00:00Z',
            status: 'revoked'
          }]);
        })
        .then(() => {
          return Establishment.query().upsertGraph([{
            id: 100,
            profiles: [
              { id: 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9' },
              { id: 'b2b8315b-82c0-4b2d-bc13-eb13e605ee88' },
              { id: 'a942ffc7-e7ca-4d76-a001-0b5048a057d9' },
              { id: 'a942ffc7-e7ca-4d76-a001-0b5048a057d0' },
              { id: 'ae28fb31-d867-4371-9b4f-79019e71232f' }
            ],
            roles: [
              {
                type: 'pelh',
                profileId: 'ae28fb31-d867-4371-9b4f-79019e71232f'
              },
              {
                type: 'nacwo',
                profileId: 'a942ffc7-e7ca-4d76-a001-0b5048a057d9'
              },
              {
                type: 'nacwo',
                profileId: 'a942ffc7-e7ca-4d76-a001-0b5048a057d0'
              }
            ]
          },
          {
            id: 101,
            profiles: [
              { id: 'ae28fb31-d867-4371-9b4f-79019e71232f' },
              { id: 'ae28fb31-d867-4371-9b4f-79019e71232e' },
              { id: 'a942ffc7-e7ca-4d76-a001-0b5048a057d9' }
            ],
            roles: [
              {
                type: 'pelh',
                profileId: 'ae28fb31-d867-4371-9b4f-79019e71232f'
              }
            ]
          }], { relate: true });
        })
        .then(() => {
          return PIL.query().insertGraph([
            {
              id: '9fbe0218-995d-47d3-88e7-641fc046d7d1',
              profileId: 'f0835b01-00a0-4c7f-954c-13ed2ef7efd9',
              establishmentId: 100,
              licenceNumber: 'AB-123',
              status: 'active',
              issueDate: '2016-01-01T12:00:00Z',
              procedures: ['A', 'B'],
              updatedAt: '2020-01-01T12:00:00Z',
              pilTransfers: [
                {
                  fromEstablishmentId: 101,
                  toEstablishmentId: 100,
                  createdAt: '2019-01-01T12:00:00Z'
                }
              ]
            },
            {
              id: '247912b2-e5c6-487d-b717-f8136491f7b8',
              profileId: 'b2b8315b-82c0-4b2d-bc13-eb13e605ee88',
              establishmentId: 100,
              licenceNumber: 'D-456',
              status: 'active',
              issueDate: '2016-01-01T12:00:00Z',
              procedures: ['D'],
              notesCatD: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
              updatedAt: '2020-01-01T12:00:00Z'
            },
            {
              id: 'ba3f4fdf-27e4-461e-a251-3188faa35df5',
              profileId: 'a942ffc7-e7ca-4d76-a001-0b5048a057d9',
              establishmentId: 100,
              licenceNumber: 'F-789',
              status: 'active',
              issueDate: '2016-01-01T12:00:00Z',
              procedures: ['F'],
              notesCatF: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
              updatedAt: '2020-01-01T12:00:00Z'
            },
            {
              id: '117298fa-f98f-4a98-992d-d29b60703866',
              profileId: 'ae28fb31-d867-4371-9b4f-79019e71232f', // Colin is at both establishments
              establishmentId: 100,
              licenceNumber: 'C-987',
              status: 'active',
              issueDate: '2016-01-01T12:00:00Z',
              procedures: ['C'],
              species: ['Mice', 'Rats'],
              updatedAt: '2020-01-01T12:00:00Z',
              reviewDate: '2024-12-01T12:00:00Z'
            }
          ]);
        })
        .then(() => {
          return Invitation.query().insertGraph([
            {
              id: 'f5bd5c7d-0cfc-4e3b-bbab-1ad59de9af1e',
              email: 'TEST1@example.com', // test that case does not have to match profile.email
              establishmentId: 101,
              role: 'basic',
              token: 'abcdef'
            },
            {
              id: 'b75a466f-a3fb-483e-9d1f-c35d80d85da3',
              email: 'test2@example.com',
              establishmentId: 101,
              role: 'admin',
              token: 'abcdef'
            }
          ]);
        })
        .then(() => {
          return Project.query().insert([
            {
              id: 'ba3f4fdf-27e4-461e-a251-111111111111',
              title: 'Test project',
              status: 'inactive',
              establishmentId: 101,
              schemaVersion: 1
            },
            {
              id: 'ba3f4fdf-27e4-461e-a251-333333333333',
              title: 'Test legacy project',
              status: 'inactive',
              establishmentId: 101,
              schemaVersion: 0
            }
          ]);
        })
        .then(() => {
          return ProjectVersion.query().insert([
            {
              projectId: 'ba3f4fdf-27e4-461e-a251-111111111111',
              id: 'ba3f4fdf-27e4-461e-a251-222222222222',
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
              projectId: 'ba3f4fdf-27e4-461e-a251-333333333333',
              id: 'ba3f4fdf-27e4-461e-a251-444444444444',
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
              projectId: 'ba3f4fdf-27e4-461e-a251-333333333333',
              id: 'ed0687a2-1a52-4cc8-b100-588a04255c59',
              data: {
                conditions: [
                  {
                    key: 'custom',
                    edited: 'This is a custom condition'
                  }
                ]
              }
            }
          ]);
        });
    });
};
