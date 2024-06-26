import { Handler, t } from 'elysia';
import {
  dependencies as deps,
  version
} from '../../package.json';

export const versionsApi = {
  response: t.Any({
    description: 'Information about the installed versions of the GeoStyler parsers.' +
      ' If the `Accept` header is set to `application/json`, the response will be a JSON object. ' +
      'Otherwise, the response will be an HTML page.'
  })
};

console.log('werer');

export const versions: Handler = ({
  request
}) => {
  if (request.headers.get('accept') === 'application/json') {
    return {
      'geostyler-rest': version,
      'geostyler-mapbox-parser': getVersionString('geostyler-mapbox-parser'),
      'geostyler-mapfile-parser': getVersionString('geostyler-mapfile-parser'),
      'geostyler-qgis-parser': getVersionString('geostyler-qgis-parser'),
      'geostyler-sld-parser': getVersionString('geostyler-sld-parser'),
      'geostyler-lyrx-parser': getVersionString('geostyler-lyrx-parser')
    };
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
              GeoStyler Mapbox Parser: {getVersionString('geostyler-mapbox-parser')}
            </li>
            <li>
              GeoStyler Mapfile Parser: {getVersionString('geostyler-mapfile-parser')}
            </li>
            <li>
              GeoStyler QGIS Parser: {getVersionString('geostyler-qgis-parser')}
            </li>
            <li>
              GeoStyler SLD Parser: {getVersionString('geostyler-sld-parser')}
            </li>
            <li>
              GeoStyler ArcGIS Parser: {getVersionString('geostyler-lyrx-parser')}
            </li>
          </ul>
        </body>
      </html>
    );
  }
};

const getVersionString = (parserName: string) => {
  return deps[parserName as keyof typeof deps]
    ? `${deps[parserName as keyof typeof deps]}`
    : 'not installed';
};
