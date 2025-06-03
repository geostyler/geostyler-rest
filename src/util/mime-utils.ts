export const stripOptions = (mimeType: string): string => {
  // Remove any parameters from the MIME type
  return mimeType.split(';')[0].trim();
};

const jsonRegexp = /^application\/(vnd\.[^+]+\+)?json$/i;
const xmlRegexp = /^application\/(vnd\.[^+]+\+)?xml$/i;

export const isJsonMimeType = (mimeType: string): boolean => {
  return jsonRegexp.test(stripOptions(mimeType));
};

export const isXmlMimeType = (mimeType: string): boolean => {
  return xmlRegexp.test(stripOptions(mimeType));
};
