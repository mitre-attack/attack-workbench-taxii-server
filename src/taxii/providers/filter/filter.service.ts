import { Injectable } from "@nestjs/common";
import { ObjectFiltersDto } from "./dto";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { SPEC_VERSION } from "./constants";
import { isDefined } from "class-validator";

// TODO remove this after integrating attack-data-model
type BasicStixObject = {
  id: string;
  type: string;
  spec_version: string;
  version: string;
  created: string;
  modified: string;
};

@Injectable()
export class FilterService {
  constructor(private readonly logger: Logger) {
    logger.setContext(FilterService.name);
  }

  private isMatch(
    stixObject: BasicStixObject,
    filters: ObjectFiltersDto,
  ): boolean {
    const { addedAfter, matches } = filters;

    // Filter by match[id], match[type], match[version], and match[spec_version]
    if (matches) {
      for (const match of matches) {
        const { id, type, version, spec_version } = match;

        /**
         * For each property, we use the Array.some() method to check if any of the target
         * values match the corresponding property of the stixObject.
         *
         * If none of the target values match, the method returns false, indicating that
         * the object does not match the current match instance.
         *
         * Multiple match instances are treated as an AND condition, while multiple
         * values within each match instance are treated as an OR condition, as per the
         * TAXII 2.1 specification.
         */

        // check match[id]
        if (
          id &&
          !id.some((targetId) => this.hasMatchingId(stixObject, targetId))
        ) {
          return false;
        }

        // check match[type]
        if (
          type &&
          !type.some((targetType) =>
            this.hasMatchingType(stixObject, targetType),
          )
        ) {
          return false;
        }

        // check match[version]
        if (
          version &&
          !version.some((targetVersion) =>
            this.hasMatchingVersion(stixObject, targetVersion),
          )
        ) {
          return false;
        }

        // check match[spec_version]
        if (
          spec_version &&
          !spec_version.some((targetSpecVersion) =>
            this.hasMatchingSpecVersion(stixObject, targetSpecVersion),
          )
        ) {
          return false;
        }
      }
    }

    // check added_after (include those objects added after the specified timestamp)
    if (addedAfter && new Date(stixObject.created) <= new Date(addedAfter)) {
      return false;
    }

    return true;
  }

  private hasMatchingId(
    stixObject: BasicStixObject,
    targetId: string,
  ): boolean {
    // check match[id]
    if (targetId) {
      if (stixObject.id !== targetId) {
        return false;
      }
    }
    return true;
  }

  private hasMatchingType(
    stixObject: BasicStixObject,
    targetType: string,
  ): boolean {
    if (targetType) {
      if (stixObject.type !== targetType) {
        return false;
      }
    }
    return true;
  }

  private hasMatchingVersion(
    stixObject: BasicStixObject,
    targetVersion: string,
  ): boolean {
    if (targetVersion) {
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
      if (
        Object.prototype.hasOwnProperty.call(referenceObject, "spec_version")
      ) {
        // STIX 2.0 objects cannot contain the spec_version prop. Therefore, if a STIX object is found to
        // have the spec_version property, the object cannot be considered version 2.0–compliant.
        return false;
      }
    } else if (targetSpecVersion === SPEC_VERSION.V21) {
      if (
        !Object.prototype.hasOwnProperty.call(referenceObject, "spec_version")
      ) {
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
  private hasMatchingSpecVersion(
    stixObject: BasicStixObject,
    targetSpecVersion: string,
  ): boolean {
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
    if (
      !this.isCompliantWithSpecVersion(
        stixObject,
        SPEC_VERSION.DEFAULT_UNSPECIFIED,
      )
    ) {
      return false;
    }
    return true;
  }

  /**
   * Filters an array of objects based on the specified ObjectFiltersDto. Returns the post-filtered resultant array.
   * This method is used by the ObjectService's findOne method. It passes the entire array of objects that were
   * synchronously returned from the database.
   * @param stixObjects The pre-filtered array of STIX objects to be processed.
   * @param filters The set of URL query parameters to filter the objects by.
   */
  filterObjects(
    stixObjects: BasicStixObject[],
    filters?: ObjectFiltersDto,
  ): Object[] {
    this.logger.debug(
      `Executing sortAscending with filters ${JSON.stringify(filters)}`,
      this.constructor.name,
    );

    // Now that the list is sorted, filter (keep) objects that match any supplied filter arguments. Filter arguments
    // in this case include filtering by added_after (i.e. only including objects added after the specified timestamp)
    // and by match query parameters (e.g., ?match[id]=x, ?match[type]=y; i.e., only including objects that
    // contained the specified property indicated in the MatchDto
    if (filters) {
      // const { addedAfter, match } = filters;
      // let {id, type, version, specVersion} = match;

      // A placeholder array to store objects that match at least one search param. This array will be returned.
      const matchingObjects: Object[] = [];

      stixObjects.forEach((currObject) => {
        if (this.isMatch(currObject, filters)) {
          matchingObjects.push(currObject);
        }
      });
      // All filters have been applied. Return the sorted, filtered array.
      return matchingObjects;
    }
    // No filters were passed. Just return the sorted, original array.
    return stixObjects;
  }

  /**
   * Filters a single object based on the specified ObjectFiltersDto. The supplied object will either be resolved or
   * rejected depending on whether the specified object matches the supplied filters. This method is used by the
   * ObjectService's findByCollectionId method. It streams each object into this method as they are being
   * asynchronously returned from the database.
   * @param stixObject The STIX object to filter.
   * @param filters The set of URL query parameters to filter the object by.
   */
  async filterObject(
    stixObject: BasicStixObject,
    filters?: ObjectFiltersDto,
  ): Promise<Object> {
    return new Promise((resolve, reject) => {
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
