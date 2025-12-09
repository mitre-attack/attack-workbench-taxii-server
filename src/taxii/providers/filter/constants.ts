/**
 * This enum encapsulates the supported values for the 'spec_version' URL query filter parameter.
 *
 * IMPORTANT NOTE ON 'DEFAULT_UNSPECIFIED':
 *
 * For ATT&CK Workbench TAXII 2.1 release 1.0, the default behavior mentioned above is being overridden. Instead,
 * when no spec_version parameter is provided, the server will return the 2.0 specification version of the requested
 * object(s). This is a temporary measure to provide relief for users that are currently using the Unfetter TAXII
 * 2.0 server (located at cti-taxii.mitre.org) and expect STIX 2.0 objects to be returned by default. This grace
 * period is temporary and the default expected TAXII 2.1 behavior will be restored on a later ATT&CK Workbench
 * TAXII 2.1 version release.
 */
export enum SPEC_VERSION {
  V20 = '2.0',
  V21 = '2.1',
  V20_V21 = '2.0,2.1',
  V21_V20 = '2.1,2.0',
  DEFAULT_UNSPECIFIED = '2.1', // <-- change to 2.1 when ready to convert back to default TAXII 2.1 behavior (see
  // note above)
}
