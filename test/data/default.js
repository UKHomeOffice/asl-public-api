module.exports = models => {

  const { Establishment, Place } = models;

  return Promise.resolve()
    .then(() => {
      return Establishment.create({
        id: 100,
        name: 'University of Croydon',
        country: 'england',
        address: '100 High Street',
        email: 'test@example.com',
        places: [
          { site: 'Lunar House', name: 'Room 101', suitability: ['SA'], holding: ['LTH'] },
          { site: 'Lunar House', name: 'Room 102', suitability: ['SA'], holding: ['STH'] }
        ]
      }, { include: Place });
    })
    .then(() => {
      return Establishment.create({
        id: 101,
        name: 'Marvell Pharmaceuticals',
        country: 'england',
        address: '101 High Street',
        email: 'test@example.com',
        places: [
          { site: 'Apollo House', name: 'Room 101', suitability: ['SA'], holding: ['LTH'] },
          { site: 'Apollo House', name: 'Room 102', suitability: ['SA'], holding: ['STH'] }
        ]
      }, { include: Place });
    });

};
