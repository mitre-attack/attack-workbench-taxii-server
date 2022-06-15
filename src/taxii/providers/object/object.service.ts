import { Injectable } from "@nestjs/common";
import { ObjectRepository } from "./object.repository";
import { ObjectFiltersDto } from "../filter/dto";
import { TaxiiNotFoundException } from "src/common/exceptions";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { FilterService } from "../filter";
import { StixBundleInterface } from "src/stix/dto/interfaces/stix-bundle.interface";
import { StixObjectInterface } from "src/stix/dto/interfaces/stix-object.interface";
import { StixObjectPropertiesInterface } from "src/stix/dto/interfaces/stix-object-properties.interface";

@Injectable()
export class ObjectService {
  constructor(
    private readonly logger: Logger,
    private readonly filterService: FilterService,
    private readonly stixObjectRepo: ObjectRepository
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
   *
   * @param filters
   */
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

  // TODO NOT IMPLEMENTED
  // POST {api-root}/collection-_dto/{id}/objects/
  addObjects(objects: Array<Object>) {}

  // TODO NOT IMPLEMENTED
  // DELETE {api-root}/collection-_dto/{id}/objects/{object-id}/
  deleteObject(object: Object) {}
}
