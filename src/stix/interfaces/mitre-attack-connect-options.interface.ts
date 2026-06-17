export interface MitreAttackConnectOptionsInterface {
  // The base URL from which the ATT&CK collection index (index.json) and STIX bundles are served.
  // Defaults to the raw GitHub content URL for github.com/mitre-attack/attack-stix-data.
  baseUrl?: string;

  // How long (in milliseconds) fetched resources (the collection index and STIX bundles) are cached
  // in memory before being re-fetched from GitHub.
  cacheTtlMs?: number;
}
