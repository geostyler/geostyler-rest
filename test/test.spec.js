/* Released under the BSD 2-Clause License
 *
 * Copyright © 2020-present, meggsimum (Christian Mayer) and GeoStyler contributors
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

const request = require('supertest');
const assert = require('assert')
const server = require('../index');

const rootPath = process.env.GS_REST_ROOT_PATH || '/geostyler-rest';
const transformRpcPath = `${rootPath}/api/rpc/transform`;
const getVersionsPath = `${rootPath}/api/versions`;

describe(getVersionsPath, () => {
  it('returns the correct version information as JSON', done => {
    request(server)
      .get(getVersionsPath)
      .expect('Content-Type', /json/)
      .expect(res => {
        assert.equal(typeof res.body, 'object');
        assert.notEqual(typeof res.body['geostyler-rest'], 'undefined');
        assert.notEqual(typeof res.body['geostyler-mapbox-parser'], 'undefined');
        assert.notEqual(typeof res.body['geostyler-mapfile-parser'], 'undefined');
        assert.notEqual(typeof res.body['geostyler-qgis-parser'], 'undefined');
        assert.notEqual(typeof res.body['geostyler-sld-parser'], 'undefined');
      })
      .expect(200, done);
  });
  it('returns the correct version information as HTML', done => {
    request(server)
      .get(getVersionsPath)
      .set('Accept', 'text/html')
      .expect('Content-Type', /html/)
      .expect(res => {
        assert.notEqual(res.text.indexOf('<html>'), -1);
      })
      .expect(200, done);
  });
});

describe(`${transformRpcPath}`, () => {
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
      .post(transformRpcPath + '?sourceFormat=mapbox&targetFormat=mapbox')
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
      .post(transformRpcPath + '?sourceFormat=sld&targetFormat=mapbox')
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
      .post(transformRpcPath + '?sourceFormat=mapbox&targetFormat=sld')
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
      .post(transformRpcPath + '?sourceFormat=mapbox&targetFormat=qml')
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
      .post(transformRpcPath + '?sourceFormat=mapbox&targetFormat=qml')
      .set('Content-Type', 'application/json')
      .send('some nonsense data')
      .expect('Content-Type', /json/)
      .expect((res) => {
        assert.strictEqual(res.body.msg, 'Error reading input');
      })
      .expect(400, done);
  });
});
