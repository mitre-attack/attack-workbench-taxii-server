export const DEFAULT_EXT_DETAILS =
  'https://docs.oasis-open.org/cti/taxii/v2.1/os/taxii-v2.1-os.html';

export enum TaxiiHttpErrorStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  NOT_ACCEPTABLE = 406,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  SERVICE_UNAVAILABLE = 503,
}
