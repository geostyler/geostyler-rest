import { Handler, StatusMap, t } from 'elysia';
import { db } from '../db/init-drizzle';
import { styleTable } from '../db/schema';
import { count, eq, SQL } from 'drizzle-orm';
import { randomUUIDv7 } from 'bun';
import { HTTPHeaders } from 'elysia/dist/types';
import { ElysiaCookie } from 'elysia/dist/cookies';
import { apply } from 'json-merge-patch';

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

export const capabilities: Handler = async ({
  headers
}) => {
  const host = headers.host;

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
        href: `http://${host}/ogc/api?f=json`,
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
    ]};
};

export const conformance: Handler = async () => {
  return {
    conformsTo: [
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/json',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/manage-styles',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/sld-10',
      'http://www.opengis.net/spec/ogcapi-styles-1/1.0/conf/sld-11'
    ]};
};

export const styles: Handler = async ({
  headers
}) => {
  const list = await db.select().from(styleTable);
  const host = headers.host;

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
        href: `http://${host}/ogc/styles/metadata${style.styleId}?f=json`,
        type: 'application/json',
        rel: 'describedBy'
      }]
    }))
  };

};

export const getStyle: Handler = async ({
  params: { styleid },
  set
}) => {
  const list = await db.select().from(styleTable).where(eq(styleTable.styleId, styleid));
  if (list.length === 0) {
    set.status = 404;
    return {
      error: 'Style not found',
      code: 'INVALID_INPUT'
    };
  }
  // TODO content negotiation and check for f parameter
  // TODO check for possible transformations and do them
  set.headers['content-type'] = list[0].format || 'text/plain';
  return list[0].style;
};

export const getStyleMetadata: Handler = async ({
  params: { styleid },
  set
}) => {
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
  db.insert(styleTable).values({
    styleId: id,
    title: id,
    metadata: {},
    style: body as string,
    format: headers['content-type'],
  });
  set.headers.location = `http://${headers.host}/ogc/styles/${id}`;
  set.status = 201;
};

export const postStyle: Handler = async ({
  body,
  set,
  headers
}) => {
  const id = randomUUIDv7();
  await insertStyle(id, set, body as string, headers);
};

export const putStyle: Handler = async ({
  params: { styleid },
  body,
  headers,
  set
}) => {
  const cnt = await db.select({ count: count() }).from(styleTable).where(eq(styleTable.styleId, styleid));
  if (cnt[0].count > 0) {
    await db.update(styleTable).set({
      style: body as string,
    }).where(eq(styleTable.styleId, styleid));
    set.status = 204;
    return;
  }
  await insertStyle(styleid, set, body as string, headers);
  set.status = 201;
};

export const deleteStyle: Handler = async ({
  params: { styleid },
  set
}) => {
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
  set
}) => {
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
  set
}) => {
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
