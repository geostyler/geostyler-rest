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
import { describe, it, expect } from 'bun:test';
import { app } from '../src';

describe('root ("/")', () => {
  it(`redirects to /api-docs`, async () => {
    const response = await app
      .handle(new Request(`http://localhost:${app.server?.port}/`))

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe('/api-docs');
  });
});

describe('/info/versions', () => {
  it('returns the correct version information as JSON (with accept header)', async () => {
    const response = await app
      .handle(new Request(`http://localhost:${app.server?.port}/info/versions`, {
        headers: {
          'accept': 'application/json'
        }
      }))

    expect(response.headers.get('content-type')).toContain('application/json');

    const infos = await response.json();

    expect(Object.keys(infos)).toContain('geostyler-rest');
    expect(Object.keys(infos)).toContain('geostyler-mapbox-parser');
    expect(Object.keys(infos)).toContain('geostyler-lyrx-parser');
    // expect(response).toContain('geostyler-mapfile-parser');
    expect(Object.keys(infos)).toContain('geostyler-qgis-parser');
    expect(Object.keys(infos)).toContain('geostyler-sld-parser');
  });

  it('returns the correct version information as HTML', async () => {
    const response = await app
      .handle(new Request(`http://localhost:${app.server?.port}/info/versions`))

    expect(response.headers.get('content-type')).toContain('text/html');

    const html = await response.text();

    expect(html).toContain('GeoStyler REST API Versions');
  });
});

describe('/api/transform', () => {
  const data = {
    "name": "Demo Style",
    "rules": [
      {
        "name": "Rule 1",
        "symbolizers": [
          {
            "kind": "Mark",
            "wellKnownName": "circle"
          }
        ]
      }
    ]
  };
  const sld = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:se="http://www.opengis.net/se"><NamedLayer><Name>Demo Style</Name><UserStyle><Name>Demo Style</Name><Title>Demo Style</Title><FeatureTypeStyle><Rule><Name>Rule 1</Name><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName></Mark></Graphic></PointSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';
  it('returns unchanged input for equal source and target format', async () => {
    const response = await app
      .handle(
        new Request(`http://localhost:${app.server?.port}/api/transform?&targetFormat=geostyler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
      )

    expect(response.status).toEqual(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json();
    expect(body).toEqual(data);
  });

  it('returns 400 for equal source and target format with nonsense input', async () => {
    const response = await app
    .handle(new Request(`http://localhost:${app.server?.port}/api/transform?&targetFormat=mapbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'some nonsense data'
    }));

    expect(response.status).toEqual(400);
  });

  it('returns Mapbox JSON', async () => {
    const response = await app
    .handle(new Request('http://localhost:8888/api/transform?&targetFormat=mapbox', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    }))

    expect(response.status).toEqual(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json();
    expect(body.version).toBeDefined();
  });

  it('returns lyrx JSON', async () => {
    const response = await app
    .handle(new Request('http://localhost:8888/api/transform?&targetFormat=lyrx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }))

    expect(response.status).toEqual(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json();
    expect(body.stylingRules).toBeDefined();
  });

  it('returns SLD string', async () => {
    const response = await app
    .handle(new Request('http://localhost:8888/api/transform?&targetFormat=sld', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }))

    expect(response.status).toEqual(200);
    const body = await response.text();
    expect(body).toEqual(sld);
  });

  it('returns QML string', async () => {
    const response = await app
    .handle(new Request('http://localhost:8888/api/transform?&targetFormat=qml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }))

    expect(response.status).toEqual(200);
    const body = await response.text();
    expect(body).toStartWith('<!DOCTYPE qgis');
  });
});
