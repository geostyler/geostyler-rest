import { Handler, StatusMap, t } from 'elysia';
import { db } from '../db/init-drizzle';
import { resourceTable, styleTable } from '../db/schema';
import { count, eq } from 'drizzle-orm';
import { randomUUIDv7 } from 'bun';
import { HTTPHeaders } from 'elysia/dist/types';
import { ElysiaCookie } from 'elysia/dist/cookies';
import { apply } from 'json-merge-patch';
import { DOMParser } from '@xmldom/xmldom';
import MapboxStyleParser from 'geostyler-mapbox-parser';
import SldStyleParser from 'geostyler-sld-parser';
import QGISStyleParser from 'geostyler-qgis-parser';
import LyrxParser from 'geostyler-lyrx-parser';
import { logger } from 'loggisch';
import { Style } from 'geostyler-style';

const formatMap: any = {
  mapbox: 'application/vnd.mapbox.style+json',
  // mapfile: 'application/vnd.mapfile.style+json',
  sld10: 'application/vnd.ogc.sld+xml;version=1.0',
  sld11: 'application/vnd.ogc.sld+xml;version=1.1',
  qgis: 'application/vnd.qgis.style+xml',
  lyrx: 'application/x-esri-lyrx',
  geostyler: 'application/vnd.geostyler+json'
};

const parserMap: any = {
  'application/vnd.mapbox.style+json': new MapboxStyleParser(),
  // 'application/vnd.mapfile.style+json': new MapfileStyleParser(),
  'application/vnd.ogc.sld+xml;version=1.0': new SldStyleParser({ sldVersion: '1.0.0' }),
  'application/vnd.ogc.sld+xml;version=1.1': new SldStyleParser({ sldVersion: '1.1.0' }),
  'application/vnd.qgis.style+xml': new QGISStyleParser(),
  'application/x-esri-lyrx': {
    readStyle: async (style: string) => ((new LyrxParser()).readStyle(JSON.parse(style))),
    writeStyle: async (style: Style) => ((new LyrxParser()).writeStyle(style))
  },
  'application/vnd.geostyler+json': {
    readStyle: async (style: string) => ({ output: JSON.parse(style) }),
    writeStyle: async (style: Style) => ({ output: JSON.stringify(style, null, 2) })
  }
};

const availableMimetypes = Object.values(formatMap);
const availableFormats = Object.keys(formatMap);

const authentication = 'Basic ' + Buffer.from(`${process.env.OGC_USER}:${process.env.OGC_PASSWORD}`).toString('base64');

export const capabilitiesApi = {
  response: t.Any({
    description: 'The capabilities for this OGC API styles server'
  })
};

export const conformanceApi = {
  response: t.Any({
    description: 'The list of conformance classes implemented by this API'
  })
};

export const stylesApi = {
  response: t.Any({
    description: 'The list of styles currently shared by this API'
  })
};

export const getStyleApi = {
  response: t.Any({
    description: 'Retrieves a style by its ID in the specified format'
  })
};

export const getStyleMetadataApi = {
  response: t.Any({
    description: 'Retrieves a style\'s metadata by its ID'
  })
};

export const postStyleApi = {
  response: t.Any({
    description: 'Add a new style to the server'
  })
};

export const putStyleApi = {
  response: t.Any({
    description: 'Add a new style to the server'
  })
};

export const deleteStyleApi = {
  response: t.Any({
    description: 'Remove a new style from the server'
  })
};

export const putStyleMetadataApi = {
  response: t.Any({
    description: 'Update metadata of a style'
  })
};

export const patchStyleMetadataApi = {
  response: t.Any({
    description: 'Update metadata of a style partially'
  })
};

export const resourcesApi = {
  response: t.Any({
    description: 'Fetch the list of resources available in the server'
  })
};

export const getResourceApi = {
  response: t.Any({
    description: 'Get a resource by its ID'
  })
};

export const putResourceApi = {
  response: t.Any({
    description: 'Add or update a resource by its ID'
  })
};

export const deleteResourceApi = {
  response: t.Any({
    description: 'Delete a resource by its ID'
  })
};

export const capabilities: Handler = async ({
  headers,
  query: { f },
  set
}) => {
  const host = headers.host;
  if (f !== 'json' && !headers.accept?.includes('application/json')) {
    set.status = 406;
    return {
      error: 'Invalid format requested. Only "json" is supported.',
      code: 'INVALID_INPUT'
    };
  }

  return {
    title: 'Styles API',
    links: [
      {
        href: `http://${host}/ogc/?f=json`,
        rel: 'self',
        type: 'application/json',
        title: 'this document'
      },
      {
        href: `http://${host}/api-docs/json?f=json`,
        rel: 'service',
        type: 'application/vnd.oai.openapi+json;version=3.0',
        title: 'the API definition in JSON'
      },
      {
        href: `http://${host}/ogc/conformance?f=json`,
        rel: 'conformance',
        type: 'application/json',
        title: 'list of conformance classes implemented by this API'
      },
      {
        href: `http://${host}/ogc/styles?f=json`,
        rel: 'data',
        type: 'application/json',
        title: 'the set of styles shared via this API'
      }
    ]
  };
};

export const conformance: Handler = async ({
  headers,
  query: { f },
  set
}) => {
  if (f !== 'json' && !headers.accept?.includes('application/json')) {
    set.status = 406;
    return {
      error: 'Invalid format requested. Only "json" is supported.',
      code: 'INVALID_INPUT'
    };
  }

  return {
    conformsTo: [
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-common-1/1.0/req/json',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/manage-styles',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/mapbox-styles',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/sld-10',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/sld-11',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/resources',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/manage-resources'
    ]
  };
};

export const styles: Handler = async ({
  headers,
  set,
  query: { f }
}) => {
  const list = await db.select().from(styleTable);
  const host = headers.host;

  if (f !== 'json' && !headers.accept?.includes('application/json')) {
    set.status = 406;
    return {
      error: 'Invalid format requested. Only "json" is supported.',
      code: 'INVALID_INPUT'
    };
  }

  return {
    styles: list.map(style => ({
      id: `${style.styleId}`,
      title: style.title,
      links: [{
        href: `http://${host}/ogc/styles/${style.styleId}?f=sld10`,
        type: 'application/vnd.ogc.sld+xml;version=1.0',
        rel: 'stylesheet'
      }, {
        href: `http://${host}/ogc/styles/${style.styleId}?f=sld11`,
        type: 'application/vnd.ogc.sld+xml;version=1.1',
        rel: 'stylesheet'
      }, {
        href: `http://${host}/ogc/styles/${style.styleId}?f=lyrx`,
        type: 'application/x-esri-lyrx',
        rel: 'stylesheet'
      }, {
        href: `http://${host}/ogc/styles/${style.styleId}?f=mapbox`,
        type: 'application/vnd.mapbox.style+json',
        rel: 'stylesheet'
      }, {
        href: `http://${host}/ogc/styles/${style.styleId}?f=qgis`,
        type: 'application/vnd.qgis.style+xml',
        rel: 'stylesheet'
      }, {
        href: `http://${host}/ogc/styles/${style.styleId}?f=geostyler`,
        type: 'application/vnd.geostyler+json',
        rel: 'stylesheet'
      }, {
        href: `http://${host}/ogc/styles/${style.styleId}/metadata?f=json`,
        type: 'application/json',
        rel: 'describedBy'
      }]
    }))
  };
};

export const getStyle: Handler = async ({
  params: { styleid },
  set,
  headers,
  query: { f }
}) => {
  const list = await db.select().from(styleTable).where(eq(styleTable.styleId, styleid));
  if (list.length === 0) {
    set.status = 404;
    return {
      error: 'Style not found',
      code: 'INVALID_INPUT'
    };
  }
  logger.debug('Native mime type:', list[0].format);

  let mimeType;
  if (f) {
    if (!availableFormats.includes(f)) {
      set.status = 406;
      return {
        error: `Invalid format requested. Supported formats are: ${availableFormats.join(', ')}`,
        code: 'INVALID_INPUT'
      };
    }
    mimeType = formatMap[f];
  }
  logger.debug('Mime type after f processing:', mimeType);
  if (!mimeType) {
    const mimeTypes = (headers.accept || '').split(',');
    for (const item of mimeTypes) {
      const trimmedItem = item.includes('sld') ? item : item.trim().split(';')[0];
      if (availableMimetypes.includes(trimmedItem)) {
        mimeType = trimmedItem;
        break;
      }
    }
  }
  logger.debug('Possible mime type after content negotiation:', mimeType);
  if (!availableMimetypes.includes(mimeType)) {
    set.status = 406;
    return {
      error: `Invalid mime type requested. Supported mime types are: ${availableMimetypes.join(', ')}`,
      code: 'INVALID_INPUT'
    };
  }
  let result;
  if (mimeType !== list[0].format) {
    const gsStyle = (await parserMap[list[0].format as string].readStyle(list[0].style)).output;
    if (mimeType === 'application/vnd.geostyler+json') {
      result = gsStyle;
    } else {
      result = (await parserMap[mimeType].writeStyle(gsStyle)).output;
    }
  } else {
    result = list[0].style;
  }

  set.headers['content-type'] = mimeType;
  return result;
};

export const getStyleMetadata: Handler = async ({
  params: { styleid },
  query: { f },
  set,
  headers
}) => {
  if (f !== 'json' && !headers.accept?.includes('application/json')) {
    set.status = 406;
    return {
      error: 'Invalid format requested. Only "json" is supported.',
      code: 'INVALID_INPUT'
    };
  }

  set.headers['content-type'] = 'application/json';

  const list = await db.select().from(styleTable).where(eq(styleTable.styleId, styleid));
  if (list.length === 0) {
    set.status = 404;
    return {
      error: 'Style not found',
      code: 'INVALID_INPUT'
    };
  }
  return list[0].metadata;
};

interface SetType {
  headers: HTTPHeaders;
  status?: number | keyof StatusMap;
  redirect?: string;
  cookie?: Record<string, ElysiaCookie>;
}

const insertStyle = async (id: string, set: SetType, body: string, headers: Record<string, string | undefined>) => {
  const cnt = await db.select({ count: count() }).from(styleTable).where(eq(styleTable.styleId, id));
  if (cnt[0].count > 0) {
    set.status = 409;
    return {
      error: 'Style with this id already exists',
      code: 'INVALID_INPUT'
    };
  }

  let fmt = headers['content-type'];
  if (fmt === 'application/vnd.ogc.sld+xml') {
    const xml = new DOMParser().parseFromString(body, 'application/xml');
    const version = xml.documentElement?.getAttribute('version');
    if (version === '1.0.0') {
      fmt = 'application/vnd.ogc.sld+xml;version=1.0';
    } else if (version === '1.1.0') {
      fmt = 'application/vnd.ogc.sld+xml;version=1.1';
    }
  }

  await db.insert(styleTable).values({
    styleId: id,
    title: id,
    metadata: {},
    style: body as string,
    format: fmt,
  });
  set.headers.location = `http://${headers.host}/ogc/styles/${id}`;
  set.status = 201;
};

export const postStyle: Handler = async ({
  request,
  set,
  headers
}) => {
  if (headers.authorization !== authentication) {
    set.status = 401;
    set.headers['WWW-Authenticate'] = 'Basic realm="GeoStyler OGC API"';
    return {
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    };
  }

  const types = Object.values(formatMap);
  if (!types.includes(headers['content-type'])) {
    set.status = 415;
    return {
      error: 'Content-Type must be one of ' + types.join(', '),
      code: 'INVALID_INPUT'
    };
  }

  const id = randomUUIDv7();
  await insertStyle(id, set, await request.text(), headers);
};

export const putStyle: Handler = async ({
  params: { styleid },
  request,
  headers,
  set
}) => {
  if (headers.authorization !== authentication) {
    set.status = 401;
    set.headers['WWW-Authenticate'] = 'Basic realm="GeoStyler OGC API"';
    return {
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    };
  }

  const types = Object.values(formatMap);

  if (!types.includes(headers['content-type'])) {
    set.status = 415;
    return {
      error: 'Content-Type must be one of ' + types.join(', '),
      code: 'INVALID_INPUT'
    };
  }

  const cnt = await db.select({ count: count() }).from(styleTable).where(eq(styleTable.styleId, styleid));
  if (cnt[0].count > 0) {
    await db.update(styleTable).set({
      style: await request.text(),
    }).where(eq(styleTable.styleId, styleid));
    set.status = 204;
    return;
  }
  await insertStyle(styleid, set, await request.text(), headers);
  set.status = 201;
};

export const deleteStyle: Handler = async ({
  params: { styleid },
  headers,
  set
}) => {
  if (headers.authorization !== authentication) {
    set.status = 401;
    set.headers['WWW-Authenticate'] = 'Basic realm="GeoStyler OGC API"';
    return {
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    };
  }

  const deleted = await db.delete(styleTable).where(eq(styleTable.styleId, styleid)).returning();
  if (deleted.length === 0) {
    set.status = 404;
    return {
      error: 'Style not found',
      code: 'INVALID_INPUT'
    };
  }
  set.status = 204;
};

export const putStyleMetadata: Handler = async ({
  params: { styleid },
  body,
  set,
  headers
}) => {
  if (headers.authorization !== authentication) {
    set.status = 401;
    set.headers['WWW-Authenticate'] = 'Basic realm="GeoStyler OGC API"';
    return {
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    };
  }

  if (!headers['content-type']?.includes('application/json')) {
    set.status = 415;
    return {
      error: 'Content-Type must be application/json',
      code: 'INVALID_INPUT'
    };
  }

  const list = await db.update(styleTable).set({
    metadata: body
  }).where(eq(styleTable.styleId, styleid)).returning();
  if (list.length === 0) {
    set.status = 404;
    return {
      error: 'Style not found',
      code: 'INVALID_INPUT'
    };
  }
  set.status = 204;
};

export const patchStyleMetadata: Handler = async ({
  params: { styleid },
  body,
  set,
  headers
}) => {
  if (headers.authorization !== authentication) {
    set.status = 401;
    set.headers['WWW-Authenticate'] = 'Basic realm="GeoStyler OGC API"';
    return {
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    };
  }

  if (!headers['content-type']?.includes('application/merge-patch+json')) {
    set.status = 415;
    return {
      error: 'Content-Type must be application/merge-patch+json',
      code: 'INVALID_INPUT'
    };
  }

  const list = await db.select().from(styleTable).where(eq(styleTable.styleId, styleid));
  if (list.length === 0) {
    set.status = 404;
    return {
      error: 'Style not found',
      code: 'INVALID_INPUT'
    };
  }
  const metadata = list[0].metadata || {};
  const patchedMetadata = apply(metadata, body);
  await db.update(styleTable).set({
    metadata: patchedMetadata
  }).where(eq(styleTable.styleId, styleid));
  set.status = 204;
};

export const resources: Handler = async ({
  headers,
  set,
  query: { f }
}) => {
  if (f !== 'json' && !headers.accept?.includes('application/json')) {
    set.status = 406;
    return {
      error: 'Invalid format requested. Only "json" is supported.',
      code: 'INVALID_INPUT'
    };
  }

  const resourceList = await db.select().from(resourceTable);

  return {
    resources: [resourceList.map(resource => ({
      id: resource.resourceId,
      link: {
        href: resource.resourceId,
        type: resource.format,
        rel: '???'
      }
    }))]
  };
};

export const getResource: Handler = async ({
  params: { resourceId },
  headers,
  set,
}) => {
  const resource = await db.select().from(resourceTable).where(eq(resourceTable.resourceId, resourceId));
  if (resource.length === 0) {
    set.status = 404;
    return {
      error: 'Resource not found',
      code: 'INVALID_INPUT'
    };
  }
  if (!headers.accept?.includes(resource[0].format)) {
    set.status = 406;
    return {
      error: `Invalid format requested. Supported format is: ${resource[0].format}`,
      code: 'INVALID_INPUT'
    };
  }

  set.headers['Content-Type'] = resource[0].format;
  set.headers['Content-Disposition'] = `attachment; filename="${resource[0].resourceId}"`;
  return new Response(new Uint8Array(resource[0].data));
};

export const putResource: Handler = async ({
  params: { resourceId },
  request,
  headers,
  set
}) => {
  const data = Buffer.from(await request.arrayBuffer());

  if (headers.authorization !== authentication) {
    set.status = 401;
    set.headers['WWW-Authenticate'] = 'Basic realm="GeoStyler OGC API"';
    return {
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    };
  }

  await db.insert(resourceTable).values({
    resourceId,
    format: headers['content-type'] || 'application/octet-stream',
    data
  }).onConflictDoUpdate({
    target: resourceTable.resourceId,
    set: {
      format: headers['content-type'] || 'application/octet-stream',
      data
    }
  });

  set.status = 204;
};

export const deleteResource: Handler = async ({
  params: { resourceId },
  headers,
  set
}) => {
  if (headers.authorization !== authentication) {
    set.status = 401;
    set.headers['WWW-Authenticate'] = 'Basic realm="GeoStyler OGC API"';
    return {
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    };
  }

  const changes = await db.delete(resourceTable).where(eq(resourceTable.resourceId, resourceId));
  if (changes === 0) {
    set.status = 404;
    return {
      error: 'Resource not found',
      code: 'INVALID_INPUT'
    };
  };

  set.status = 204;
};
