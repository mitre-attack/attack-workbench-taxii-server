import { Injectable } from "@nestjs/common";
import { ObjectWorkbenchRepository } from "./object.workbench.repository";
import { ObjectFiltersDto } from "../filter/dto";
import {
  TaxiiNotFoundException,
  TaxiiServiceNotImplementedException,
} from "src/common/exceptions";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { FilterService } from "../filter";
import { StixBundleInterface } from "src/stix/interfaces/stix-bundle.interface";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
// import { AttackObjectDefinition } from "../../../stix/schema/attack-object.schema";

@Injectable()
export class ObjectService {
  constructor(
    private readonly logger: Logger,
    private readonly filterService: FilterService,
    private readonly stixObjectRepo: ObjectWorkbenchRepository
  ) {
    logger.setContext(ObjectService.name);
  }

  /**
   * TODO This is not fully implemented. At the time of this writing, this function was not necessary, but it may be
   *  useful in the future.
   */
  async findAll(): Promise<StixObjectInterface[]> {
    return await this.stixObjectRepo.findAll();
  }

  /**
   * Retrieves all STIX objects in a collection bundle. Primarily used to retrieve collections by ATT&CK domains, e.g.,
   * "enterprise-attack", "ics-attack", "mobile-attack", etc.
   * @param filters TAXII 2.1 filters such as `match` and `added_after` can be passed to limit the response to a subset of
   *               STIX objects which match the search criteria
   */
  // async findByCollection(
  //   filters?: ObjectFiltersDto
  // ): Promise<StixObjectPropertiesInterface[]> {
  //   if (!filters.collectionId) {
  //     throw new TaxiiNotFoundException({
  //       name: "Collection ID Missing",
  //       description: `${this.constructor.name} requires a collectionId in order to retrieve STIX objects.`,
  //     });
  //   }
  //
  //   const attackObjects: AttackObjectDefinition[] =
  //     await this.stixObjectRepo.findByCollection(filters.collectionId);
  //
  //   // Now that we've retrieved the STIX objects, we need to sort and filter them by any supplied URL query params
  //   // However, if no objects were returned, we can just return the empty list
  //   if (!attackObjects) {
  //     return [];
  //   } else if (attackObjects.length === 0) {
  //     return [];
  //   }
  //
  //   // Extract the list of STIX objects from the STIX bundle
  //
  //   const stixObjects: StixObjectPropertiesInterface[] = [];
  //   attackObjects.forEach((item) => {
  //     stixObjects.push(item.stix);
  //   });
  //   // const stixObjects: StixObjectPropertiesInterface[] = attackObjects.map(
  //   //   (value) => {
  //   //     return value.stix;
  //   //   }
  //   // );
  //
  //   this.logger.debug(
  //     `Successfully retrieved ${stixObjects.length} STIX objects`,
  //     this.constructor.name
  //   );
  //
  //   // Remove the x-mitre-collection object from the array because it is not a core STIX object. The array only
  //   // contains one of these objects, so break after the object is found.
  //   for (let i = 0; i < stixObjects.length; i++) {
  //     if (stixObjects[i].type === "x-mitre-collection") {
  //       stixObjects.splice(i, 1);
  //       this.logger.debug(
  //         "Removed all instances of objects whose type equals x-mitre-collection",
  //         this.constructor.name
  //       );
  //       break; // end the loop cycle once x-mitre-collection object has been removed
  //     }
  //   }
  //   // Filter/sort then return. The original list will be returned if there are no filters.
  //   return this.filterService.sortAscending(stixObjects, filters);
  // }

  async findByCollection(
    filters?: ObjectFiltersDto
  ): Promise<StixObjectPropertiesInterface[]> {
    if (!filters.collectionId) {
      throw new TaxiiNotFoundException({
        name: "Collection ID Missing",
        description: `${this.constructor.name} requires a collectionId in order to retrieve STIX objects.`,
      });
    }

    const stixBundle: StixBundleInterface =
      await this.stixObjectRepo.findByCollection(filters.collectionId);

    // Now that we've retrieved the STIX objects, we need to sort and filter them by any supplied URL query params
    // However, if no objects were returned, we can just return the empty list
    if (!stixBundle.objects) {
      return [];
    } else if (stixBundle.objects.length === 0) {
      return [];
    }

    // Extract the list of STIX objects from the STIX bundle
    const stixObjects: StixObjectPropertiesInterface[] = stixBundle.objects;
    this.logger.debug(
      `Successfully retrieved ${stixObjects.length} STIX objects`,
      this.constructor.name
    );

    // Remove the x-mitre-collection object from the array because it is not a core STIX object. The array only
    // contains one of these objects, so break after the object is found.
    for (let i = 0; i < stixObjects.length; i++) {
      if (stixObjects[i].type === "x-mitre-collection") {
        stixObjects.splice(i, 1);
        this.logger.debug(
          "Removed all instances of objects whose type equals x-mitre-collection",
          this.constructor.name
        );
        break; // end the loop cycle once x-mitre-collection object has been removed
      }
    }
    // Filter/sort then return. The original list will be returned if there are no filters.
    return this.filterService.sortAscending(stixObjects, filters);
  }

  /**
   * Gets an array containing one STIX object.
   * @param collectionId The returned STIX object must belong to the specified collection
   * @param objectId The returned STIX object must contain the specified STIX ID
   * @param filters
   */
  async findOne(
    collectionId: string,
    objectId: string,
    filters?: ObjectFiltersDto
  ): Promise<StixObjectPropertiesInterface[]> {
    // Retrieve the STIX object from the connected STIX repository.
    const stixObject: StixObjectInterface[] = await this.stixObjectRepo.findOne(
      collectionId,
      objectId,
      filters.versions
    );

    if (!stixObject) {
      throw new TaxiiNotFoundException({
        title: "Requested STIX ID not found",
        description: `A STIX object with ${objectId} could not be found in collection ${collectionId}.`,
      });
    }

    // There may be other non-STIX properties on this object. We only want to returned the embedded STIX object(s).
    const objects = stixObject.map((object) => object.stix);

    return !filters
      ? objects
      : this.filterService.sortAscending(objects, filters);
  }

  /**
   * The 'Add Objects' endpoint is not implemented because this TAXII 2.1 implementation was primarily designed to be
   * coupled with the ATT&CK Workbench, and add/POST functionality is already implemented through the ATT&CK Workbench
   * REST API & Front End SPA.
   */
  addObjects() {
    throw new TaxiiServiceNotImplementedException({
      title: "'Add Objects' is not implemented",
      description:
        "This TAXII 2.1 implementation does not support the Add Objects (5.5) endpoint. If coupled with " +
        "Workbench however, objects can be added via the ATT&CK Workbench Front End and/or REST API.",
      externalDetails:
        "https://docs.oasis-open.org/cti/taxii/v2.1/csprd02/taxii-v2.1-csprd02.html#_Toc16526040",
    });
  }

  /**
   * The 'Delete An Object' endpoint is not implemented because this TAXII 2.1 implementation was primarily designed to be
   * coupled with the ATT&CK Workbench, and add/POST functionality is already implemented through the ATT&CK Workbench
   * REST API & Front End SPA.
   */
  deleteAnObject() {
    throw new TaxiiServiceNotImplementedException({
      title: "'Delete An Object' is not implemented",
      description:
        "This TAXII 2.1 implementation does not support the 'Delete An Object' (5.7) endpoint. If coupled with " +
        "Workbench however, objects can be deleted via the ATT&CK Workbench Front End and/or REST API.",
      externalDetails:
        "https://docs.oasis-open.org/cti/taxii/v2.1/csprd02/taxii-v2.1-csprd02.html#_Toc16526042",
    });
  }
}
