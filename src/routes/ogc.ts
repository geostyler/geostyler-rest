import { Handler, t } from 'elysia';
import { db } from '../db/init-drizzle';
import { styleTable } from '../db/schema';
import { eq } from 'drizzle-orm';

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
