const request = require('supertest');
const server = require('../index');

const basePath = '/geostyler-rest/rpc/transform';

describe(`${basePath}`, () => {
  it('POST returns JSON from request body', done => {
    var data = {
      version: 8,
      name: 'Demo Style',
      layers: [{
        id: 'Rule 1',
        type: 'circle',
        paint: {
          'circle-radius': 16,
          'circle-color': '#4b33c8'
        }
      }]
    };

    request(server)
      .post(basePath + '?sourceFormat=mapbox&targetFormat=sld')
      .set('Content-Type', 'application/json')
      .send(data)
      .expect('Content-Type', /xml/)
      .expect(200, done);
  });
});
