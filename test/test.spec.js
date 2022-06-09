const request = require('supertest');
const assert = require('assert')
const server = require('../index');

const basePath = '/geostyler-rest/rpc/transform';

describe(`${basePath}`, () => {
  const data = {
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
  const sld = `
  <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <NamedLayer>
      <Name>Demo Style</Name>
      <UserStyle>
        <Name>Demo Style</Name>
        <Title>Demo Style</Title>
        <FeatureTypeStyle>
          <Rule>
            <Name>Rule 1</Name>
            <PointSymbolizer>
              <Graphic>
                <Mark>
                  <WellKnownName>circle</WellKnownName>
                  <Fill>
                    <CssParameter name="fill">#4b33c8</CssParameter>
                  </Fill>
                </Mark>
                <Size>32</Size>
              </Graphic>
            </PointSymbolizer>
          </Rule>
        </FeatureTypeStyle>
      </UserStyle>
    </NamedLayer>
  </StyledLayerDescriptor>
  `;

  it('returns unchanged input for equal source and target format', done => {
    request(server)
      .post(basePath + '?sourceFormat=mapbox&targetFormat=mapbox')
      .set('Content-Type', 'application/json')
      .send(data)
      .expect('Content-Type', /json/)
      .expect((res) => {
        assert.deepEqual(res.body, data);
      })
      .expect(200, done);
  });

  it('returns Mapbox JSON', done => {
    request(server)
      .post(basePath + '?sourceFormat=sld&targetFormat=mapbox')
      .set('Content-Type', 'text/xml')
      .send(sld)
      .expect('Content-Type', /json/)
      .expect((res) => {
        assert.deepEqual(res.body, data);
      })
      .expect(200, done);
  });

  it('returns SLD XML', done => {
    request(server)
      .post(basePath + '?sourceFormat=mapbox&targetFormat=sld')
      .set('Content-Type', 'application/json')
      .send(data)
      .expect('Content-Type', /xml/)
      .expect((res) => {
        assert.notStrictEqual(res.text.indexOf('<StyledLayerDescriptor'), -1);
      })
      .expect(200, done);
  });

  it('returns QML XML', done => {
    request(server)
      .post(basePath + '?sourceFormat=mapbox&targetFormat=qml')
      .set('Content-Type', 'application/json')
      .send(data)
      .expect('Content-Type', /xml/)
      .expect((res) => {
        assert.notStrictEqual(res.text.indexOf('<qgis>'), -1);
        assert.notStrictEqual(res.text.indexOf('<renderer-v2 type="RuleRenderer">'), -1);
      })
      .expect(200, done);
  });

  it('returns 400 on nonsense input', done => {
    request(server)
      .post(basePath + '?sourceFormat=mapbox&targetFormat=qml')
      .set('Content-Type', 'application/json')
      .send('some nonsense data')
      .expect('Content-Type', /json/)
      .expect((res) => {
        assert.strictEqual(res.body.msg, 'Error reading input');
      })
      .expect(400, done);
  });
});
