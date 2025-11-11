/**
 * Interface representing the individual parts of a semantic version number.
 * @interface SemverParts
 * @property {number} major - The major version number
 * @property {number} minor - The minor version number
 * @property {number} patch - The patch version number
 */
export interface SemverParts {
  major: number;
  minor: number;
  patch: number;
}
