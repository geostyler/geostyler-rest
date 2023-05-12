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

/**
 * REST routes for styles
 */
module.exports = function (app) {
  const rootPath = process.env.GS_REST_ROOT_PATH || '/geostyler-rest';
  const transformRpcPath = `${rootPath}/api/rpc/transform`;
  const getVersionsPath = `${rootPath}/api/versions`;

  /**
   * Lists the version information of this API and the GeoStyler libs used.
   */
  app.get(getVersionsPath, async (req, res) => {
    const packageJson = require('../package.json');
    const deps = packageJson.dependencies;
    let returnHtml = false;

    // check if we have an Accept: text/html request header => return HTML
    const acceptHeader = req.headers.accept;
    if (acceptHeader && acceptHeader !== '') {
      const acceptValues = acceptHeader.split(',');
      acceptValues.forEach(val => {
        if (val === 'text/html') {
          returnHtml = true;
        }
      });
    }

    if (returnHtml) {
      const html = `
        <html>
        <body>
          <ul>
            <li>
              GeoStyler REST: ${packageJson.version}
            </li>
            <li>
              GeoStyler Mapbox Parser: ${deps['geostyler-mapbox-parser']}
            </li>
            <li>
              GeoStyler Mapfile Parser: ${deps['geostyler-mapfile-parser']}
            </li>
            <li>
              GeoStyler QGIS Parser: ${deps['geostyler-qgis-parser']}
            </li>
            <li>
              GeoStyler SLD Parser: ${deps['geostyler-sld-parser']}
            </li>
          </ul>
        </body>
      `
      res.status(200).send(html);
    } else {
      // return JSON if not explicitly forced to return HTML
      res.status(200).json({
        'geostyler-rest': packageJson.version,
        'geostyler-mapbox-parser': deps['geostyler-mapbox-parser'],
        'geostyler-mapfile-parser': deps['geostyler-mapfile-parser'],
        'geostyler-qgis-parser': deps['geostyler-qgis-parser'],
        'geostyler-sld-parser': deps['geostyler-sld-parser']
      });
    }
  });

  /**
   * Uses GeoStyler to convert between various formats for styling of geographic data.
   */
  app.post(transformRpcPath, async (req, res) => {
    const sourceStyle = req.body;

    if (!sourceStyle || sourceStyle === '') {
      res.status(400).json({ msg: 'error', details: 'No source style style given in POST body.' });
      return;
    }

    const sourceFormat = req.query.sourceFormat;
    const targetFormat = req.query.targetFormat;

    if (!sourceFormat || !targetFormat) {
      res.status(400).json({ msg: 'error', details: 'URL param "sourceFormat" or "targetFormat" is missing.' });
      return;
    }

    const sourceParser = getParserFromUrlParam(sourceFormat);
    const targetParser = getParserFromUrlParam(targetFormat);

    if (sourceParser === undefined) {
      res.status(400).json({ msg: 'Error reading source format', details: 'Unknown "sourceFormat"' });
      return;
    }

    if (targetParser === undefined) {
      res.status(400).json({ msg: 'Error reading target format', details: 'Unknown "targetFormat"' });
      return;
    }

    // read given input
    const readResponse = await sourceParser.readStyle(sourceStyle);
    if (Array.isArray(readResponse.errors) && readResponse.errors.length) {
      res.status(400).json({ msg: 'Error reading input', details: readResponse?.errors?.[0]?.message || '' });
      return;
    }

    // send back the input if sourceFormat equals targetFormat
    if (sourceFormat.toLowerCase() === targetFormat.toLowerCase()) {
      sendTargetStyle(sourceStyle, sourceFormat, res);
      return;
    }

    // transform input to output
    const writeResponse = await targetParser.writeStyle(readResponse.output);
    if (Array.isArray(writeResponse.errors) && writeResponse.errors.length) {
      res.status(400).json({ msg: 'Error transforming input to output', details: readResponse?.errors?.[0]?.message || '' });
      return;
    }

    // send HTTP response
    sendTargetStyle(writeResponse.output, targetFormat, res);
  });
};

/**
 * Send the HTTP response for the target style object.
 *
 * @param {String} targetStyle Transformed style object in target format
 * @param {String} targetFormat Target content-type format, e.g. 'application/json'
 * @param {*} res The express response object
 */
const sendTargetStyle = (targetStyle, targetFormat, res) => {
  const targetType = getContentTypeFromUrlParam(targetFormat);

  res.type(targetType);

  if (targetType === 'application/xml' || targetType === 'text/plain') {
    res.status(200).send(targetStyle);
  } else if (targetType === 'application/json') {
    if (typeof targetStyle === 'string') {
      targetStyle = JSON.parse(targetStyle);
    }
    res.status(200).json(targetStyle);
  }
}

/**
 * Returns the corresponding parser instance for the given format from the URL.
 *
 * @param {String} paramVal Query param value for the format, e.g. 'qml'
 * @returns {*} GeoStyler Parser instance
 */
const getParserFromUrlParam = paramVal => {
  if (!paramVal) {
    return undefined;
  }

  const SldParser = require('geostyler-sld-parser').SldStyleParser;
  const MapboxParser = require('geostyler-mapbox-parser').MapboxStyleParser;
  const MapfileParser = require('geostyler-mapfile-parser').MapfileStyleParser;
  const QgisParser = require('geostyler-qgis-parser').QGISStyleParser;

  switch (paramVal.toLowerCase()) {
    case 'mapbox':
      return new MapboxParser();
    case 'map':
      return new MapfileParser();
    case 'sld':
      return new SldParser();
    case 'qml':
      return new QgisParser();
    default:
      return undefined;
  }
};

/**
 * Returns the corresponding content type for the given format from the URL.
 *
 * @param {String} paramVal Query param value for the format, e.g. 'qml'
 * @returns {String} Content-Type
 */
const getContentTypeFromUrlParam = paramVal => {
  if (!paramVal) {
    return undefined;
  }

  switch (paramVal.toLowerCase()) {
    case 'mapbox':
      return 'application/json'
    case 'map':
      return 'text/plain'
    case 'sld':
      return 'application/xml'
    case 'qml':
      return 'application/xml'
    default:
      return undefined;
  }
};
