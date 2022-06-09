/**
 * REST routes for styles
 *
 * @author C. Mayer (meggsimum)
 */
module.exports = function (app) {
  const rootPath = process.env.GS_REST_ROOT_PATH || '/geostyler-rest';
  const transformRpcPath = `${rootPath}/api/rpc/transform`;

  /**
   * Uses GeoStyler to convert between various formats for styling of geographic data.
   */
  app.post(transformRpcPath, async (req, res) => {
    const sourceStyle = req.body;

    if (!sourceStyle || sourceStyle === '') {
      res.status(400).json({ msg: 'error', details: 'No source style style given in POST body.' });
    }

    const sourceFormat = req.query.sourceFormat;
    const targetFormat = req.query.targetFormat;

    if (!sourceFormat && !targetFormat) {
      res.status(400).json({ msg: 'error', details: 'URL param "sourceFormat" or "targetFormat" is missing.' });
    }

    if (sourceFormat.toLowerCase() === targetFormat.toLowerCase()) {
      sendTargetStyle(sourceStyle, sourceFormat, res);
      return;
    }
    const sourceParser = getParserFromUrlParam(sourceFormat);
    const targetParser = getParserFromUrlParam(targetFormat);

    // read given input
    const readResponse = await sourceParser.readStyle(sourceStyle);
    if (Array.isArray(readResponse.errors) && readResponse.errors.length) {
      res.status(400).json({ msg: 'Error reading input', details: '' });
      return;
    }

    // transform input to output
    const writeResponse = await targetParser.writeStyle(readResponse.output);
    if (Array.isArray(writeResponse.errors) && writeResponse.errors.length) {
      res.status(400).json({ msg: 'Error transforming input to output' });
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
