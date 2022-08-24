import { Injectable } from "@nestjs/common";
import { ObjectFiltersDto } from "./dto";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";

@Injectable()
export class FilterService {
  constructor(private readonly logger: Logger) {
    logger.setContext(FilterService.name);
  }

  sortAndFilterAscending(
    stixObjects: StixObjectPropertiesInterface[],
    filters?: ObjectFiltersDto
  ): StixObjectPropertiesInterface[] {
    this.logger.debug(
      `Executing sortAscending with filters ${JSON.stringify(filters)}`,
      this.constructor.name
    );

    // TODO remove this after validating that array is already pre-sorted by the object-collector
    // stixObjects.sort((a, b) => {
    //   const createdA = new Date(a.created).valueOf();
    //   const createdB = new Date(b.created).valueOf();
    //   if (createdA < createdB) {
    //     return -1;
    //   }
    //   if (createdA > createdB) {
    //     return 1;
    //   }
    //   return 0;
    // });

    // Now that the list is sorted, filter (keep) objects that match any supplied filter arguments. Filter arguments
    // in this case include filtering by added_after (i.e. only including objects added after the specified timestamp)
    // and by match query parameters (e.g., ?match[id]=x, ?match[type]=y; i.e., only including objects that
    // contained the specified property indicated in the MatchDto
    if (filters) {
      const { addedAfter, match } = filters;
      // let {id, type, version, specVersion} = match;

      // A placeholder array to store objects that match at least one search param. This array will be returned.
      const filteredObjects: StixObjectPropertiesInterface[] = [];

      // Iterate over the unfiltered objects and check for match conditions. The current iteration will break if
      // a match dis-qualifier is triggered. If we make if to the end of the iteration without breaking, assume
      // that the object is a match and include it in the return/response. This is an out-of-place sort.
      for (let i = 0; i < stixObjects.length; i++) {
        // This is the current STIX object to check
        const currObject: StixObjectPropertiesInterface = stixObjects[i];

        if (match) {
          const { id, type, version, specVersion } = match;

          // check match[id]
          if (id) {
            if (currObject.id !== match.id) {
              continue; // skip this loop iteration
            }
            // this.logger.verbose(`Id match on object ${currObject.id.toString()}`, this.constructor.name);
          }

          // check match[type]
          if (type) {
            if (currObject.type !== match.type) {
              continue; // skip this loop iteration
            }
            // this.logger.verbose(`Type match on object ${currObject.id.toString()}`, this.constructor.name);
          }

          // check match[version]
          if (version) {
            if (currObject.modified) {
              if (
                new Date(currObject.modified).toISOString() !== match.version
              ) {
                continue; // skip this loop iteration
              }
            } else if (currObject.created) {
              if (
                new Date(currObject.created).toISOString() !== match.version
              ) {
                continue; // skip this loop iteration
              }
            }
            // this.logger.verbose(`Version match on object ${currObject.id.toString()}`, this.constructor.name);
          }

          // check match[spec_version]
          if (specVersion) {
            if (currObject.spec_version !== match.specVersion) {
              continue; // skip this loop iteration
            }
            // this.logger.verbose(`Spec version match on object ${currObject.id.toString()}`, this.constructor.name);
          }
        }

        // check added_after (include those objected added after the specified timestamp)
        if (addedAfter) {
          if (new Date(currObject.created).toISOString() <= addedAfter) {
            /**
             * We only want to store objects that are *newer* than (i.e., that come before) the added_after
             * date. So, we can say that an object should be skipped if it comes before (i.e., is older
             * than) then added_after date
             */
            // this.logger.debug(`Skipping current object (created ${currObject.created}) B/C it is older than added_after (${added_after})`, this.constructor.name);
            continue; // skip this loop iteration
          }
        }
        // All checks passed! Store the object to return!
        filteredObjects.push(currObject);
      }
      // All filters have been applied. Return the sorted, filtered array.
      return filteredObjects;
    }
    // No filters were passed. Just return the sorted, original array.
    return stixObjects;
  }

  async filterObject(
    stixObject: StixObjectPropertiesInterface,
    filters?: ObjectFiltersDto
  ): Promise<StixObjectPropertiesInterface> {
    return new Promise((resolve, reject) => {
      if (filters) {
        const { addedAfter, match } = filters;

        if (match) {
          const { id, type, version, specVersion } = match;

          // check match[id]
          if (id) {
            if (stixObject.id !== match.id) {
              return reject(
                `Object (${id}) does not match 'id' filter: (${match.id})`
              );
            }
          }

          // check match[type]
          if (type) {
            if (stixObject.type !== match.type) {
              return reject(
                `Object (${id}) does not match 'type' filter: (${match.type})`
              );
            }
          }

          // check match[version]
          if (version) {
            if (stixObject.modified) {
              if (
                new Date(stixObject.modified).toISOString() !== match.version
              ) {
                return reject(
                  `Object (${id}) does not match 'version' filter: (${match.version})`
                );
              }
            } else if (stixObject.created) {
              if (
                new Date(stixObject.created).toISOString() !== match.version
              ) {
                return reject(
                  `Object (${id}) does not match 'version' filter: (${match.version})`
                );
              }
            }
          }

          // check match[spec_version]
          if (specVersion) {
            if (stixObject.spec_version !== match.specVersion) {
              return reject(
                `Object (${id}) does not match 'specVersion' filter: (${match.specVersion})`
              );
            }
          }
        }

        if (addedAfter) {
          if (new Date(stixObject.created).toISOString() <= addedAfter) {
            /**
             * We only want to store objects that are *newer* than (i.e., that come before) the added_after
             * date. So, we can say that an object should be skipped if it comes before (i.e., is older
             * than) then added_after date
             */
            // this.logger.debug(`Skipping current object (created ${currObject.created}) B/C it is older than added_after (${added_after})`, this.constructor.name);
            return reject(
              `Object (${stixObject.id}) was not added after: ${addedAfter}`
            );
          }
        }
        // All checks passed! Store the object to return!
        return resolve(stixObject);
      }
    });
  }
}
