import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { SPEC_VERSION } from './constants';
import { ObjectFiltersDto } from './dto';

// TODO remove this after integrating attack-data-model
type BasicStixObject = {
  id: string;
  type: string;
  spec_version: string;
  version: string;
  created: string;
  modified: string;
};

// Version filter keywords
const VERSION_KEYWORD = {
  ALL: 'all',
  FIRST: 'first',
  LAST: 'last',
} as const;

@Injectable()
export class FilterService {
  constructor(private readonly logger: Logger) {
    logger.setContext(FilterService.name);
  }

  private isMatch(stixObject: BasicStixObject, filters: ObjectFiltersDto): boolean {
    const { addedAfter, match } = filters;

    if (match) {
      const { id, type, version, spec_version } = match;

      // Each field is ANDed: all specified fields must match
      // Within each field, values are ORed: any value can match

      if (id?.length && !id.some((targetId) => this.hasMatchingId(stixObject, targetId))) {
        return false;
      }

      if (
        type?.length &&
        !type.some((targetType) => this.hasMatchingType(stixObject, targetType))
      ) {
        return false;
      }

      if (
        version?.length &&
        !version.some((targetVersion) => this.hasMatchingVersion(stixObject, targetVersion))
      ) {
        return false;
      }

      if (
        spec_version?.length &&
        !spec_version.some((targetSpecVersion) =>
          this.hasMatchingSpecVersion(stixObject, targetSpecVersion),
        )
      ) {
        return false;
      }
    }

    // check added_after
    if (addedAfter && new Date(stixObject.created) <= new Date(addedAfter)) {
      return false;
    }

    return true;
  }

  private hasMatchingId(stixObject: BasicStixObject, targetId: string): boolean {
    // check match[id]
    if (targetId) {
      if (stixObject.id !== targetId) {
        return false;
      }
    }
    return true;
  }

  private hasMatchingType(stixObject: BasicStixObject, targetType: string): boolean {
    if (targetType) {
      if (stixObject.type !== targetType) {
        return false;
      }
    }
    return true;
  }

  private hasMatchingVersion(stixObject: BasicStixObject, targetVersion: string): boolean {
    if (targetVersion) {
      // Version keywords (all, first, last) require comparing multiple objects
      // and cannot be evaluated on a single object. Pass them through here;
      // actual filtering happens in applyVersionFilter() after collection.
      if (
        targetVersion === VERSION_KEYWORD.ALL ||
        targetVersion === VERSION_KEYWORD.FIRST ||
        targetVersion === VERSION_KEYWORD.LAST
      ) {
        return true;
      }

      // Exact timestamp matching
      if (stixObject.modified) {
        if (new Date(stixObject.modified).toISOString() !== targetVersion) {
          return false;
        }
      } else if (stixObject.created) {
        if (new Date(stixObject.created).toISOString() !== targetVersion) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Checks if the specified STIX object has (or does not have) a compliant 'spec_version' property.
   * If the STIX object is version 2.0, the 'spec_version' property must be undefined.
   * If the STIX object is version 2.1, the 'spec_version' property must be defined AND must match the targetSpecVersion
   * @param referenceObject This is the reference object to check for compliance
   * @param targetSpecVersion This is a string which represents the intended value of 'spec_version' if the object
   *                          is version 2.1
   */
  private isCompliantWithSpecVersion(
    referenceObject: BasicStixObject,
    targetSpecVersion: string,
  ): boolean {
    if (targetSpecVersion === SPEC_VERSION.V20) {
      if (Object.prototype.hasOwnProperty.call(referenceObject, 'spec_version')) {
        // STIX 2.0 objects cannot contain the spec_version prop. Therefore, if a STIX object is found to
        // have the spec_version property, the object cannot be considered version 2.0–compliant.
        return false;
      }
    } else if (targetSpecVersion === SPEC_VERSION.V21) {
      if (!Object.prototype.hasOwnProperty.call(referenceObject, 'spec_version')) {
        // STIX 2.1 objects must contain the spec_version property. Therefore, if a STIX object is found to NOT
        // have the spec_version property, then the object cannot be considered version 2.1–compliant.
        return false;
      } else if (referenceObject.spec_version !== targetSpecVersion) {
        // In this conditional block, the object is considered version 2.1–compliant because it contains the
        // spec_version property, but the value of spec_version does not match the targetSpecVersion parameter.
        return false;
      }
    }

    return true;
  }

  /**
   * Validates that the reference object is compliant with the target specification version. Each object returned
   * from the object service is checked against this target specification version. Returns false if the object does not
   * meet the user's search parameters; the object will not be returned to the user. Returns true if the object does
   * meet the user's search parameters; the object will be returned to the user.
   * @param stixObject This is a reference object to check for compliance
   * @param targetSpecVersion The target specification version is defined by the match[spec_version] URL query
   * parameter.
   * @private
   */
  private hasMatchingSpecVersion(stixObject: BasicStixObject, targetSpecVersion: string): boolean {
    if (isDefined(targetSpecVersion)) {
      switch (targetSpecVersion) {
        case SPEC_VERSION.V20: {
          // user requested STIX version 2.0 object(s)
          if (
            // verify that the current object is compliant with STIX 2.0
            !this.isCompliantWithSpecVersion(stixObject, SPEC_VERSION.V20)
          ) {
            return false;
          }
          // the object is compliant with STIX 2.0
          return true;
        }
        case SPEC_VERSION.V21: {
          // user requested STIX version 2.1 object(s)
          if (
            // verify that the current object is compliant with STIX 2.1
            !this.isCompliantWithSpecVersion(stixObject, SPEC_VERSION.V21)
          ) {
            // the object is NOT compliant with STIX 2.1
            return false;
          }
          // the object is compliant with STIX 2.1
          return true;
        }
        case SPEC_VERSION.V20_V21: {
          // user requested STIX version 2.0 AND version 2.1 object(s)
          // No validation is performed. Assume the object passes because all objects in the DB are either
          // STIX 2.0 or 2.1
          return true;
        }
        case SPEC_VERSION.V21_V20: {
          // user requested both STIX version 2.0 and version 2.1 object(s)
          // Assume the object passes because all objects in the DB are either STIX 2.0 or 2.1
          return true;
        }
        default: {
          // user requested an unsupported or invalid version. nothing to check; just reject it.
          return false;
        }
      }
    }
    /**
     * If no spec_version parameter is provided, the server MUST return only the latest specification version
     * that it can provide for each object matching the remainder of the request.
     */

    /**
     * IMPORTANT NOTE: For ATT&CK Workbench TAXII 2.1 release 1.0, the default behavior mentioned above is
     * being overridden. Instead, when no spec_version parameter is provided, the server will return the 2.0
     * specification version of the requested object(s). This is a temporary measure to provide relief for users
     * that are currently using the Unfetter TAXII 2.0 server (located at cti-taxii.mitre.org) and expect
     * STIX 2.0 objects to be returned by default. This grace period is temporary and the default expected
     * TAXII 2.1 behavior will be restored on a later ATT&CK Workbench TAXII 2.1 version release.
     */
    if (!this.isCompliantWithSpecVersion(stixObject, SPEC_VERSION.DEFAULT_UNSPECIFIED)) {
      return false;
    }
    return true;
  }

  /**
   * Applies non-version match filters and added_after.
   */
  private matchesNonVersionFilters(
    stixObject: BasicStixObject,
    filters: ObjectFiltersDto,
  ): boolean {
    const { addedAfter, match } = filters;

    if (match) {
      const { id, type, spec_version } = match;

      if (id?.length && !id.some((targetId) => stixObject.id === targetId)) {
        return false;
      }

      if (type?.length && !type.some((targetType) => stixObject.type === targetType)) {
        return false;
      }

      if (
        spec_version?.length &&
        !spec_version.some((targetSpecVersion) =>
          this.hasMatchingSpecVersion(stixObject, targetSpecVersion),
        )
      ) {
        return false;
      }
    }

    if (addedAfter && new Date(stixObject.created) <= new Date(addedAfter)) {
      return false;
    }

    return true;
  }

  /**
   * Applies version filtering to a list of objects.
   *
   * Version filter semantics:
   * - undefined/empty: return latest version of each object (default)
   * - ['all']: return all versions
   * - ['first']: return earliest version of each object
   * - ['last']: return latest version of each object
   * - ['first', 'last']: return both earliest and latest versions
   * - ['2016-01-01T01:01:01.000Z']: return exact version match
   * - ['first', '2016-01-01T01:01:01.000Z']: return earliest OR exact match
   */
  applyVersionFilter(stixObjects: BasicStixObject[], versionFilter?: string[]): BasicStixObject[] {
    // Default behavior: return latest version of each object

    // NOTE so we have an issue: if no version filter is provided as with cases where the version filter is not supported (e.g., Get Object Versions)
    // then the default behavior will kick in and only the latest versions will be returned. However, in cases where we want all versions to be returned
    // (e.g., Get Object Versions) we need to explicitly provide the 'all' keyword to override the default behavior. But the match[version] parameter
    // is not supported in Get Object Versions, so we cannot provide the 'all' keyword there. Therefore, we need to make an exception here:

    // Scenario 1: match[version] is supported AND NOT provided by user -> default to latest versions
    // Scenario 2: match[version] is supported AND provided by user -> apply user-specified filter
    // Scenario 3: match[version] is NOT supported -> return all versions (override default behavior)

    // Thus, we should change the default behavior to return all versions when versionFilter is undefined,
    // and higher up in the stack like when MatchDto is constructed we can set versionFilter to 'latest' when
    // match[version] is supported but not provided by the user.

    // No version filter provided: return everything
    if (!versionFilter?.length) {
      return stixObjects;
    }

    // 'all' keyword: return everything (no version filtering)
    if (versionFilter.includes(VERSION_KEYWORD.ALL)) {
      return stixObjects;
    }

    // Group objects by ID to handle first/last across versions
    const objectsById = this.groupById(stixObjects);
    const result: BasicStixObject[] = [];

    const hasFirst = versionFilter.includes(VERSION_KEYWORD.FIRST);
    const hasLast = versionFilter.includes(VERSION_KEYWORD.LAST);
    const exactTimestamps = versionFilter.filter(
      (v) => v !== VERSION_KEYWORD.FIRST && v !== VERSION_KEYWORD.LAST,
    );

    for (const [, versions] of objectsById) {
      // Sort by modified (or created) ascending
      const sorted = this.sortByVersion(versions);

      const matched = new Set<BasicStixObject>();

      if (hasFirst && sorted.length > 0) {
        matched.add(sorted[0]);
      }

      if (hasLast && sorted.length > 0) {
        matched.add(sorted[sorted.length - 1]);
      }

      // Check exact timestamp matches
      for (const timestamp of exactTimestamps) {
        for (const obj of sorted) {
          if (this.matchesExactVersion(obj, timestamp)) {
            matched.add(obj);
          }
        }
      }

      result.push(...matched);
    }

    return result;
  }

  /**
   * Returns only the latest version of each object (grouped by ID).
   */
  private filterToLatestVersions(stixObjects: BasicStixObject[]): BasicStixObject[] {
    const objectsById = this.groupById(stixObjects);
    const result: BasicStixObject[] = [];

    for (const [, versions] of objectsById) {
      const sorted = this.sortByVersion(versions);
      if (sorted.length > 0) {
        result.push(sorted[sorted.length - 1]); // Latest is last after ascending sort
      }
    }

    return result;
  }

  /**
   * Groups objects by their ID.
   */
  private groupById(stixObjects: BasicStixObject[]): Map<string, BasicStixObject[]> {
    const grouped = new Map<string, BasicStixObject[]>();

    for (const obj of stixObjects) {
      const existing = grouped.get(obj.id);
      if (existing) {
        existing.push(obj);
      } else {
        grouped.set(obj.id, [obj]);
      }
    }

    return grouped;
  }

  /**
   * Sorts objects by version timestamp (modified or created) in ascending order.
   * Earliest first, latest last.
   */
  private sortByVersion(stixObjects: BasicStixObject[]): BasicStixObject[] {
    return [...stixObjects].sort((a, b) => {
      const aTime = new Date(a.modified || a.created).getTime();
      const bTime = new Date(b.modified || b.created).getTime();
      return aTime - bTime;
    });
  }

  /**
   * Checks if an object's version matches an exact timestamp.
   */
  private matchesExactVersion(stixObject: BasicStixObject, targetVersion: string): boolean {
    const objectVersion = stixObject.modified || stixObject.created;
    if (!objectVersion) return false;

    return new Date(objectVersion).toISOString() === targetVersion;
  }

  /**
   * Filters a single object based on non-version filters only.
   * Use this during streaming, then call applyVersionFilter on the collected results.
   *
   * Returns the object if it passes non-version filters, undefined otherwise.
   */
  filterObjectNonVersion(
    stixObject: BasicStixObject,
    filters?: ObjectFiltersDto,
  ): BasicStixObject | undefined {
    if (!filters) {
      return stixObject;
    }

    if (!this.matchesNonVersionFilters(stixObject, filters)) {
      return undefined;
    }

    return stixObject;
  }

  /**
   * Filters an array of objects based on the specified ObjectFiltersDto.
   *
   * For version filtering, objects are grouped by ID first, then filtered
   * based on version keywords (all/first/last) or exact timestamps.
   *
   * @param stixObjects The pre-filtered array of STIX objects to be processed.
   * @param filters The set of URL query parameters to filter the objects by.
   */
  filterObjects(stixObjects: BasicStixObject[], filters?: ObjectFiltersDto): object[] {
    this.logger.debug(
      `Executing filterObjects with filters ${JSON.stringify(filters)}`,
      this.constructor.name,
    );

    if (!filters) {
      // No filters: default behavior is to return latest version of each object
      return this.filterToLatestVersions(stixObjects);
    }

    const { match } = filters;

    // First, apply non-version filters (id, type, spec_version, added_after)
    let filtered = stixObjects.filter((obj) => this.matchesNonVersionFilters(obj, filters));

    // Then apply version filtering
    filtered = this.applyVersionFilter(filtered, match?.version);

    return filtered;
  }

  /**
   * Filters a single object based on the specified ObjectFiltersDto. The supplied object will either be resolved or
   * rejected depending on whether the specified object matches the supplied filters. This method is used by the
   * ObjectService's findByCollectionId method. It streams each object into this method as they are being
   * asynchronously returned from the database.
   * @param stixObject The STIX object to filter.
   * @param filters The set of URL query parameters to filter the object by.
   */
  async filterObject(stixObject: BasicStixObject, filters?: ObjectFiltersDto): Promise<object> {
    return new Promise((resolve, reject) => {
      if (!filters) {
        // No filters: default behavior is to return latest version of each object
        return resolve(this.filterToLatestVersions([stixObject]));
      }
      if (filters) {
        // All checks passed! Store the object to return!
        if (!this.isMatch(stixObject, filters)) {
          return reject(
            `STIX object with ID ${stixObject.id} did not meet one or more search filters`,
          );
        }

        return resolve(stixObject);
      }
    });
  }
}
