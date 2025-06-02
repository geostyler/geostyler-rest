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
import { Handler, ParseError, t } from 'elysia';
import { LyrxParser } from 'geostyler-lyrx-parser';
import MapboxStyleParser from 'geostyler-mapbox-parser';
import QGISStyleParser from 'geostyler-qgis-parser';
import SldParser from 'geostyler-sld-parser';

import log from 'loggisch';

export const transFormApi = {
  query: t.Object({
    sourceFormat: t.Optional(t.String({
      description: 'The format of the input style',
      enum: ['geostyler', 'sld', 'qml', 'mapbox', 'mapserver', 'lyrx']
    })),
    targetFormat: t.String({
      description: 'The format of the output style',
      enum: ['geostyler', 'sld', 'qml', 'mapbox', 'mapserver', 'lyrx'],
      default: 'mapbox'
    })
  }),
  body: t.Any({
    description: 'The style to transform in the specified format',
    required: true,
    examples: [{
      name: 'Demo Style',
      rules: [
        {
          name: 'Rule 1',
          symbolizers: [
            {
              kind: 'Mark',
              wellKnownName: 'circle'
            }
          ]
        }
      ]
    }]
  }),
  response: t.Any({
    description: 'The transformed style in the specified format'
  })
};

export const transform: Handler = async ({
  body,
  set,
  query: { sourceFormat, targetFormat }
}) => {

  if (!body) {
    log.error('Error: No source style given in POST body.');
    set.status = 400;
    return {
      error: 'No source style given in POST body.',
      code: 'INVALID_INPUT'
    };
  }

  if (!targetFormat) {
    log.error('Error: URL param "sourceFormat" or "targetFormat" is missing.');
    set.status = 400;
    return {
      error: 'URL param "sourceFormat" or "targetFormat" is missing.',
      code: 'INVALID_INPUT'
    };
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
      set.status = 400;
      return {
        error: readResponse?.errors?.[0]?.message,
        code: 'INVALID_INPUT'
      };
    }
  }

  // if no targetParser is given we return a geostyler-style
  if (targetParser === undefined) {
    return readResponse.output;
  }

  // send back the input if sourceFormat equals targetFormat
  if (sourceFormat?.toLowerCase() === targetFormat.toLowerCase()) {
    return sourceStyle;
  }

  if (readResponse.output === undefined) {
    log.error('Error reading input: ' + readResponse?.errors?.[0]?.message);
    set.status = 400;
    return {
      error: readResponse?.errors?.[0]?.message,
      code: 'INVALID_INPUT'
    };
  }

  // transform input to output
  try {
    const writeResponse = await targetParser.writeStyle(readResponse.output);
    if (Array.isArray(writeResponse.errors) && writeResponse.errors.length) {
      log.error('Error transforming input to output: ' + readResponse?.errors?.[0]?.message);
      set.status = 400;
      return {
        error: readResponse?.errors?.[0]?.message,
        code: 'INVALID_INPUT'
      };
    }

    return writeResponse.output;
  } catch (error) {
    set.status = 500;
    throw new ParseError(error as Error);
  }
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
      return 'text/plain';
    case 'sld':
    case 'qml':
      return 'application/xml';
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
const getParserFromUrlParam = (paramVal?: string) => {
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
