/**
 * Describes the ATT&CK collection index (index.json) published at
 * github.com/mitre-attack/attack-stix-data. The index documents every available STIX bundle that is
 * available as a distinct ATT&CK release, organized by collection (i.e., ATT&CK domain).
 */

export interface CollectionIndexVersion {
  // The ATT&CK release version, e.g. "19.1"
  version: string;

  // Fully-qualified URL of the STIX 2.1 bundle for this release, e.g.
  // https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-19.1.json
  url: string;

  // Timestamp at which this release was published, e.g. "2026-05-12T14:00:00.188Z"
  modified: string;
}

export interface CollectionIndexCollection {
  // STIX identifier of the x-mitre-collection object, e.g. "x-mitre-collection--1f5f1533-..."
  id: string;

  // Human-readable collection name, e.g. "Enterprise ATT&CK"
  name: string;

  description?: string;

  created: string;

  // Available releases, sorted newest-first by the publisher
  versions: CollectionIndexVersion[];
}

export interface CollectionIndex {
  id: string;
  name: string;
  description?: string;
  created: string;
  modified: string;
  collections: CollectionIndexCollection[];
}
