module.exports = models => {

  const { Establishment, Place, Profile, PIL } = models;

  return Promise.resolve()
    .then(() => {
      return Establishment.create({
        id: 100,
        name: 'University of Croydon',
        country: 'england',
        address: '100 High Street',
        email: 'test@example.com',
        places: [
          {
            site: 'Lunar House',
            name: 'Room 101',
            suitability: ['SA'],
            holding: ['LTH']
          },
          {
            site: 'Lunar House',
            name: 'Room 102',
            suitability: ['SA'],
            holding: ['STH']
          }
        ],
        profiles: [
          {
            title: 'Dr',
            firstName: 'Linford',
            lastName: 'Christie',
            address: '1 Some Road',
            postcode: 'A1 1AA',
            email: 'test@example.com',
            telephone: '01234567890',
            pil: {
              status: 'active',
              issueDate: '2017-01-01',
              revocationDate: null,
              licenceNumber: 'ABC123',
              conditions: 'Conditions'
            }
          }
        ]
      }, {
        include: [
          Place,
          {
            model: Profile,
            as: 'profiles',
            include: {
              model: PIL,
              as: 'pil'
            }
          }
        ]
      })
        .then(establishment => {
          return establishment.createRole({
            type: 'pelh',
            profile: {
              title: 'Dr',
              firstName: 'Noddy',
              lastName: 'Holder',
              address: '1 Some Road',
              postcode: 'A1 1AA',
              email: 'test@example.com',
              telephone: '01234567890'
            }
          }, { include: Profile });
        });
    })
    .then(() => {
      return Establishment.create({
        id: 101,
        name: 'Marvell Pharmaceuticals',
        country: 'england',
        address: '101 High Street',
        email: 'test@example.com',
        places: [
          {
            site: 'Apollo House',
            name: 'Room 101',
            suitability: ['SA'],
            holding: ['LTH']
          },
          {
            site: 'Apollo House',
            name: 'Room 102',
            suitability: ['SA'],
            holding: ['STH']
          }
        ],
        profiles: [
          {
            title: 'Professor',
            firstName: 'Colin',
            lastName: 'Jackson',
            address: '1 Some Road',
            postcode: 'A1 1AA',
            email: 'test@example.com',
            telephone: '01234567890'
          }
        ]
      }, {
        include: [
          Place,
          { model: Profile, as: 'profiles' }
        ]
      });
    });

};