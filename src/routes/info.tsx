import { Handler, t } from 'elysia';
import {
  dependencies as deps,
  version
} from '../../package.json';
import { Html } from '@elysiajs/html';

export const versionsApi = {
  response: t.Any({
    description: 'Information about the installed versions of the GeoStyler parsers.' +
      ' If the `Accept` header is set to `application/json`, the response will be a JSON object. ' +
      'Otherwise, the response will be an HTML page.'
  })
};

const getVersionString = (parserName: string) => {
  return deps[parserName as keyof typeof deps]
    ? `${deps[parserName as keyof typeof deps]}`
    : 'not installed';
};

export const versions: Handler = ({
  request
}) => {
  const versionMap = {
    'geostyler-rest': version,
    'geostyler-mapbox-parser': getVersionString('geostyler-mapbox-parser'),
    'geostyler-mapfile-parser': getVersionString('geostyler-mapfile-parser'),
    'geostyler-qgis-parser': getVersionString('geostyler-qgis-parser'),
    'geostyler-sld-parser': getVersionString('geostyler-sld-parser'),
    'geostyler-lyrx-parser': getVersionString('geostyler-lyrx-parser')
  };
  if (request.headers.get('accept') === 'application/json') {
    return versionMap;
  } else {
    return (
      <html lang='en'>
        <head>
          <title>GeoStyler REST API Versions</title>
        </head>
        <body>
              GeoStyler REST version {version}
          <ul>
            <li>
              GeoStyler Mapbox Parser: {versionMap['geostyler-mapbox-parser']}
            </li>
            <li>
              GeoStyler Mapfile Parser: {versionMap['geostyler-mapfile-parser']}
            </li>
            <li>
              GeoStyler QGIS Parser: {versionMap['geostyler-qgis-parser']}
            </li>
            <li>
              GeoStyler SLD Parser: {versionMap['geostyler-sld-parser']}
            </li>
            <li>
              GeoStyler ArcGIS Parser: {versionMap['geostyler-lyrx-parser']}
            </li>
          </ul>
        </body>
      </html>
    );
  }
};
