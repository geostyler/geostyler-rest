const request = require('supertest');
const server = require('../index');

const rootPath = process.env.GS_REST_ROOT_PATH || '/geostyler-rest';
const transformRpcPath = `${rootPath}/api/rpc/transform`;

describe(transformRpcPath, () => {
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
      .post(transformRpcPath + '?sourceFormat=mapbox&targetFormat=sld')
      .set('Content-Type', 'application/json')
      .send(data)
      .expect('Content-Type', /xml/)
      .expect(200, done);
  });
});
