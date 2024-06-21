import { Handler, ParseError, t } from "elysia";
import GeoStylerLyrxParser, { LyrxParser } from "geostyler-lyrx-parser";
import MapboxStyleParser from "geostyler-mapbox-parser";
import QGISStyleParser from "geostyler-qgis-parser";
// import LyrxParser from "geostyler-lyrx-parser";
import SldParser from "geostyler-sld-parser";

import log from 'loggisch';

export const transFormApi = {
  query: t.Object({
    sourceFormat: t.String({
      description: 'The format of the input style',
      enum: ['geostyler', 'sld', 'qml', 'mapbox', 'mapserver', 'lyrx'],
      default: 'geostyler'
    }),
    targetFormat: t.String({
      description: 'The format of the output style',
      enum: ['geostyler', 'sld', 'qml', 'mapbox', 'mapserver', 'lyrx'],
      default: 'sld'
    })
  }),
  body: t.Any({
    description: 'The style to transform in the specified format',
    required: true,
    examples: [
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0"
        xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"
        xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"
        xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:se="http://www.opengis.net/se">
        <NamedLayer>
          <Name>My Style</Name>
          <UserStyle>
            <Name>My Style</Name>
            <Title>My Style</Title>
            <FeatureTypeStyle>
              <Rule>
                <Name>My Rule</Name>
                <PointSymbolizer>
                  <Graphic>
                    <Mark>
                      <WellKnownName>circle</WellKnownName>
                      <Fill>
                        <CssParameter name="fill">#FF0000</CssParameter>
                      </Fill>
                    </Mark>
                    <Size>12</Size>
                  </Graphic>
                </PointSymbolizer>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`
    ]
  }),
  response: t.Any({
    description: 'The transformed style in the specified format'
  })
};

export const transform: Handler = async ({
  body,
  query: { sourceFormat, targetFormat }
}) => {

  if (!body) {
    log.error('Error: No source style style given in POST body.');
    throw new ParseError('Error', 'No source style style given in POST body.');
  }

  if (!sourceFormat || !targetFormat) {
    log.error('Error: URL param "sourceFormat" or "targetFormat" is missing.');
    throw new ParseError('Error', 'URL param "sourceFormat" or "targetFormat" is missing.');
  }

  const sourceParser = getParserFromUrlParam(sourceFormat);
  const targetParser = getParserFromUrlParam(targetFormat);

  let readResponse;

  // TODO: type should be fixed here
  let sourceStyle = body as any;

  // if no sourceParser is given we expect the body to be a geostyler-style
  if (sourceParser === undefined) {
    readResponse = { output: sourceStyle };
  } else {
    readResponse = await sourceParser.readStyle(sourceStyle);
    if (Array.isArray(readResponse.errors) && readResponse.errors.length) {
      log.error('Error reading input: ' + readResponse?.errors?.[0]?.message);
      throw new ParseError('Error reading input', readResponse?.errors?.[0]?.message);
    }
  }

  // if no targetParser is given we return a geostyler-style
  if (targetParser === undefined) {
    return readResponse.output;
  }

  // send back the input if sourceFormat equals targetFormat
  if (sourceFormat.toLowerCase() === targetFormat.toLowerCase()) {
    return sourceStyle;
  }

  if (readResponse.output === undefined) {
    log.error('Error reading input: ' + readResponse?.errors?.[0]?.message);
    throw new ParseError('Error reading input', readResponse?.errors?.[0]?.message);
  }

  // transform input to output
  const writeResponse = await targetParser.writeStyle(readResponse.output);
  if (Array.isArray(writeResponse.errors) && writeResponse.errors.length) {
    log.error('Error transforming input to output: ' + readResponse?.errors?.[0]?.message);
    throw new ParseError('Error transforming input to output', readResponse?.errors?.[0]?.message);
  }

  return writeResponse.output;
};

/**
 * Returns the corresponding content type for the given format from the URL.
 *
 * @param paramVal Query param value for the format, e.g. 'qml'
 * @returns Content-Type
 */
const getContentTypeFromParserName = (paramVal: string) => {
  if (!paramVal) {
    return undefined;
  }

  switch (paramVal.toLowerCase()) {
    case 'mapserver':
      return 'text/plain'
    case 'sld':
    case 'qml':
      return 'application/xml'
    case 'mapbox':
    case 'lyrx':
    case 'geostyler':
    default:
      return 'application/json';
  }
};

/**
 * Returns the corresponding parser instance for the given format from the URL.
 *
 * @param paramVal Query param value for the format, e.g. 'qml'
 * @returns GeoStyler Parser instance
 */
const getParserFromUrlParam = (paramVal: string) => {
  if (!paramVal) {
    return undefined;
  }

  switch (paramVal.toLowerCase()) {
    case 'lyrx':
      return new LyrxParser();
    case 'mapbox':
      return new MapboxStyleParser();
    // case 'mapserver':
    //   return new MapfileParser();
    case 'sld':
      return new SldParser();
    case 'qml':
      return new QGISStyleParser();
    case 'geostyler':
    default:
      return undefined;
  }
};
