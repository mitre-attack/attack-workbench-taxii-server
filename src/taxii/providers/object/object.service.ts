import { Injectable } from "@nestjs/common";
import { ObjectFiltersDto } from "../filter/dto";
import {
  TaxiiNotFoundException,
  TaxiiServiceNotImplementedException,
} from "src/common/exceptions";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { FilterService } from "../filter";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
import { ObjectRepository } from "./object.repository";
import { StixObjectDto } from "src/stix/dto/stix-object.dto";
import { AttackObject } from "src/hydrate/collector/schema";

@Injectable()
export class ObjectService {
  constructor(
    private readonly logger: Logger,
    private readonly filterService: FilterService,
    private readonly stixObjectRepo: ObjectRepository
  ) {
    logger.setContext(ObjectService.name);
  }

  async *streamByCollectionId(
    filters: ObjectFiltersDto
  ): AsyncIterableIterator<StixObjectDto> {
    // A collection ID is required at a minimum

    if (!filters.collectionId) {
      throw new TaxiiNotFoundException({
        name: "Collection ID Missing",
        description: `${this.constructor.name} requires a collectionId in order to retrieve STIX objects.`,
      });
    }

    // Retrieve a list of STIX objects from the database

    const attackObjects: AsyncIterableIterator<AttackObject> =
      this.stixObjectRepo.findByCollectionId(filters.collectionId);

    // For each attackObject document returned from the database...
    for await (const attackObject of attackObjects) {
      // Convert the document into a DTO instance
      const stixObject = new StixObjectDto({
        ...attackObject["_doc"].stix["_doc"],
        // FIXME is there a way we can refine the initial database query to avoid having to sift through all of this extra data?
      });

      // Run the DTO instance through the filterService, then append it onto the return array
      // The filterService will reject the promise if the DTO fails any of the filter checks, thus the object will not
      // appended to the array if any filter check fails.
      try {
        const object: StixObjectDto = await this.filterService.filterObject(
          stixObject,
          filters
        );
        yield object;
      } catch (e) {
        // Object does not match one or more filters - skip it
        this.logger.warn(e);
      }
    }
  }

  /**
   *
   * @param filters
   */
  async findByCollectionId(
    filters: ObjectFiltersDto
  ): Promise<StixObjectDto[]> {
    // A collection ID is required at a minimum

    if (!filters.collectionId) {
      throw new TaxiiNotFoundException({
        name: "Collection ID Missing",
        description: `${this.constructor.name} requires a collectionId in order to retrieve STIX objects.`,
      });
    }

    // Retrieve a list of STIX objects from the database

    const attackObjects: AsyncIterableIterator<AttackObject> =
      this.stixObjectRepo.findByCollectionId(filters.collectionId);

    // Handle edge case where database failed to return anything or returned an empty list

    // if (!attackObjects) {
    //   return [];
    //   // FIXME consider raising a 500 here - the database should always returned something
    // } else if (attackObjects.length === 0) {
    //   return [];
    //   // FIXME consider raising a 404 here
    // }

    // Extract the STIX object from each document returned from the database

    const stixObjects: StixObjectDto[] = [];

    // For each attackObject document returned from the database...
    for await (const attackObject of attackObjects) {
      // Convert the document into a DTO instance
      const stixObject = new StixObjectDto({
        ...attackObject["_doc"].stix["_doc"],
        // FIXME is there a way we can refine the initial database query to avoid having to sift through all of this extra data?
      });

      // Run the DTO instance through the filterService, then append it onto the return array
      // The filterService will reject the promise if the DTO fails any of the filter checks, thus the object will not
      // appended to the array if any filter check fails.
      try {
        const object: StixObjectDto = await this.filterService.filterObject(
          stixObject,
          filters
        );
        stixObjects.push(object);
      } catch (e) {
        // Object does not match one or more filters - skip it
        this.logger.warn(e);
      }
    }

    // const stixObjects: StixObjectDto[] = [];
    // attackObjects.forEach((attackObject) => {
    //   stixObjects.push(
    //     new StixObjectDto({
    //       ...attackObject["_doc"].stix["_doc"],
    //       // FIXME is there a way we can refine the initial database query to avoid having to sift through all of this extra data?
    //     })
    //   );
    // });

    this.logger.debug(
      `Successfully retrieved ${stixObjects.length} STIX objects`,
      this.constructor.name
    );

    // Sort & filter then return

    // return this.filterService.sortAndFilterAscending(stixObjects, filters);
    return stixObjects;
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
    // Retrieve the STIX object from the database

    const attackObjects: AttackObject[] = await this.stixObjectRepo.findOne(
      collectionId,
      objectId
    );

    // Stop processing if no objects/docs were retrieved - raise an error and let the interceptor handle the response

    if (!attackObjects) {
      throw new TaxiiNotFoundException({
        title: "Requested STIX ID not found",
        description: `A STIX object with ${objectId} could not be found in collection ${collectionId}.`,
      });
    }

    const allVersionsOfObject = attackObjects.map((attackObject) => {
      // return new StixObjectDto({ stix: attackObject });
      return new StixObjectDto({
        ...attackObject["_doc"].stix["_doc"],
        // FIXME is there a way we can refine the initial database query to avoid having to sift through all of this extra data?
      });
    });

    // There may be other non-STIX properties on this object. We only want to returned the embedded STIX object(s).
    // const object = stixObject.map((object) => object.stix);

    return !filters
      ? allVersionsOfObject
      : this.filterService.sortAndFilterAscending(allVersionsOfObject, filters);
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
