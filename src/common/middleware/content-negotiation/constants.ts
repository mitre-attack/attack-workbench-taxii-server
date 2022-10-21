import { MediaTypeObject } from "./media-type-object";

/**
 * DEFAULT_MEDIA_TYPE is reported by the 'Get API Root Information endpoint'
 */
const DEFAULT_MEDIA_TYPE = new MediaTypeObject(
  "application/taxii+json;version=2.1"
);
Object.freeze(DEFAULT_MEDIA_TYPE);

const ALL_MEDIA_TYPES = [
  "application/taxii+json;version=2.1",
  "application/taxii+json",
];
Object.freeze(ALL_MEDIA_TYPES);

/**
 * MEDIA_TYPE_TOKEN is a reference key used for accessing the MediaTypeObject on each Request object
 * i.e., req[MEDIA_TYPE_TOKEN] will reference an instance of MediaTypeObject on every request
 */
const MEDIA_TYPE_TOKEN = "taxii-content-type";
Object.freeze(MEDIA_TYPE_TOKEN);

export { DEFAULT_MEDIA_TYPE, ALL_MEDIA_TYPES, MEDIA_TYPE_TOKEN };
