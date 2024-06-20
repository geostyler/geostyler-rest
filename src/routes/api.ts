import { Handler, ParseError, t } from "elysia";
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
    example: {
      "name": "My Style",
      "rules": [
        {
          "name": "My Rule",
          "symbolizers": [
            {
              "kind": "Mark",
              "wellKnownName": "Circle",
              "color": "#FF0000",
              "radius": 6
            }
          ]
        }
      ]
    }
  }),
  response: t.Any({
    description: 'The transformed style in the specified format'
  })
};

export const transform: Handler = async ({
  body,
  query: { sourceFormat, targetFormat }
}) => {

  const sourceStyle = body as string;

  if (!sourceStyle) {
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

  if (sourceParser === undefined) {
    readResponse = { output: JSON.parse(sourceStyle) };
  } else {
    readResponse = await sourceParser.readStyle(sourceStyle);
    if (Array.isArray(readResponse.errors) && readResponse.errors.length) {
      log.error('Error reading input: ' + readResponse?.errors?.[0]?.message);
      throw new ParseError('Error reading input', readResponse?.errors?.[0]?.message);
    }
  }

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
const getContentTypeFromUrlParam = (paramVal: string) => {
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
    // case 'lyrx':
    //   return new LyrxParser();
    // case 'mapbox':
    //   return new MapboxParser();
    // case 'mapserver':
    //   return new MapfileParser();
    case 'sld':
      return new SldParser();
    // case 'qml':
    //   return new QgisParser();
    case 'geostyler':
    default:
      return undefined;
  }
};
