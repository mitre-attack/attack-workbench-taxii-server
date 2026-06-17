/**
 * Shape of the URL path segment that identifies a pinned per-release API root, e.g.
 * "attack-19.1" or "attack-8.0". The "attack-" prefix is self-describing and can never collide
 * with TAXII's reserved path segments (collections, status, objects, ...).
 */
export const RELEASE_SEGMENT_PATTERN = /^attack-(\d+\.\d+(?:\.\d+)?)$/;

/**
 * Extracts the ATT&CK release version from a pinned API root path segment.
 * @returns The release version (e.g. "19.1" for "attack-19.1"), or undefined if the segment does
 *          not denote a release.
 */
export function releaseSegmentToVersion(segment: string): string | undefined {
  const match = RELEASE_SEGMENT_PATTERN.exec(segment);
  return match ? match[1] : undefined;
}

/**
 * Builds the pinned API root path segment for an ATT&CK release version, e.g. "19.1" -> "attack-19.1".
 */
export function versionToReleaseSegment(version: string): string {
  return `attack-${version}`;
}
