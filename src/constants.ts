const MEDIATYPE_TYPE_FIELD: string = "application";
const MEDIATYPE_SUBTYPE_FIELD: string = "taxii+json";
const MEDIATYPE_OPTION_KEY_FIELD: string = "version";
const MEDIATYPE_OPTION_VALUE_FIELD: string = "2.1";
const DEFAULT_MEDIA_TYPE: string = `${MEDIATYPE_TYPE_FIELD}/${MEDIATYPE_SUBTYPE_FIELD};${MEDIATYPE_OPTION_KEY_FIELD}=${MEDIATYPE_OPTION_VALUE_FIELD}`;

Object.freeze(MEDIATYPE_TYPE_FIELD);
Object.freeze(MEDIATYPE_SUBTYPE_FIELD);
Object.freeze(MEDIATYPE_OPTION_KEY_FIELD);
Object.freeze(MEDIATYPE_OPTION_VALUE_FIELD);
Object.freeze(DEFAULT_MEDIA_TYPE);

export {
  MEDIATYPE_TYPE_FIELD,
  MEDIATYPE_SUBTYPE_FIELD,
  MEDIATYPE_OPTION_KEY_FIELD,
  MEDIATYPE_OPTION_VALUE_FIELD,
  DEFAULT_MEDIA_TYPE,
};
