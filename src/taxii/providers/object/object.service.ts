import { Injectable } from '@nestjs/common';
import { ObjectFiltersDto } from '../filter/dto';
import { TaxiiNotFoundException, TaxiiServiceNotImplementedException } from 'src/common/exceptions';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { FilterService } from '../filter';
import { ObjectRepository } from './object.repository';
import { AttackObjectEntity as MongooseAttackObject } from 'src/hydrate/schema';

@Injectable()
export class ObjectService {
  constructor(
    private readonly logger: Logger,
    private readonly filterService: FilterService,
    private readonly stixObjectRepo: ObjectRepository,
  ) {
    logger.setContext(ObjectService.name);
  }

  async *findAsyncIterableByCollectionId(filters: ObjectFiltersDto): AsyncIterableIterator<object> {
    // A collection ID is required at a minimum

    if (!filters.collectionId) {
      throw new TaxiiNotFoundException({
        name: 'Collection ID Missing',
        description: `${this.constructor.name} requires a collectionId in order to retrieve STIX objects.`,
      });
    }

    // Retrieve a list of STIX objects from the database

    const attackObjects: AsyncIterableIterator<MongooseAttackObject> =
      this.stixObjectRepo.findByCollectionId(filters.collectionId);

    // For each attackObject document returned from the database...
    for await (const attackObject of attackObjects) {
      // Convert the document into a DTO instance
      // const stixObject = new StixObjectDto({
      //   ...attackObject["_doc"].stix["_doc"],
      // });
      const stixObject = { ...attackObject['_doc'].stix['_doc'] };

      // Run the DTO instance through the filterService, then append it onto the return array
      // The filterService will reject the promise if the DTO fails any of the filter checks, thus the object will not
      // appended to the array if any filter check fails.
      try {
        const object = await this.filterService.filterObject(stixObject, filters);
        yield object;
      } catch {
        // Object does not match one or more filters - skip it
      }
    }
  }

  /**
   *
   * @param filters
   */
  async findByCollectionId(filters: ObjectFiltersDto): Promise<object[]> {
    // A collection ID is required at a minimum

    if (!filters.collectionId) {
      throw new TaxiiNotFoundException({
        name: 'Collection ID Missing',
        description: `${this.constructor.name} requires a collectionId in order to retrieve STIX objects.`,
      });
    }

    // Retrieve a list of STIX objects from the database

    const attackObjects: AsyncIterableIterator<MongooseAttackObject> =
      this.stixObjectRepo.findByCollectionId(filters.collectionId);

    // Extract the STIX object from each document returned from the database

    const stixObjects: object[] = [];

    // For each attackObject document returned from the database...
    for await (const attackObject of attackObjects) {
      const stixObject = { ...attackObject['_doc'].stix['_doc'] };

      // Run the DTO instance through the filterService, then append it onto the return array
      // The filterService will reject the promise if the DTO fails any of the filter checks, thus the object will not
      // appended to the array if any filter check fails.
      try {
        const object = await this.filterService.filterObject(stixObject, filters);
        stixObjects.push(object);
      } catch {
        // Object does not match one or more filters - skip it
      }
    }

    this.logger.debug(
      `Successfully retrieved ${stixObjects.length} STIX objects`,
      this.constructor.name,
    );

    // Sort & filter then return
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
    filters?: ObjectFiltersDto,
  ): Promise<object[]> {
    // Retrieve the STIX object from the database

    const attackObjects: MongooseAttackObject[] = await this.stixObjectRepo.findOne(
      collectionId,
      objectId,
    );

    // Stop processing if no objects/docs were retrieved - raise an error and let the interceptor handle the response

    if (!attackObjects) {
      throw new TaxiiNotFoundException({
        title: 'Requested STIX ID not found',
        description: `A STIX object with ${objectId} could not be found in collection ${collectionId}.`,
      });
    }

    const allVersionsOfObject = attackObjects.map((attackObject) => {
      return { ...attackObject['_doc'].stix['_doc'] };
    });

    return !filters
      ? allVersionsOfObject
      : this.filterService.filterObjects(allVersionsOfObject, filters);
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
        'This TAXII 2.1 implementation does not support the Add Objects (5.5) endpoint. If coupled with ' +
        'Workbench however, objects can be added via the ATT&CK Workbench Front End and/or REST API.',
      externalDetails:
        'https://docs.oasis-open.org/cti/taxii/v2.1/csprd02/taxii-v2.1-csprd02.html#_Toc16526040',
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
        'Workbench however, objects can be deleted via the ATT&CK Workbench Front End and/or REST API.',
      externalDetails:
        'https://docs.oasis-open.org/cti/taxii/v2.1/csprd02/taxii-v2.1-csprd02.html#_Toc16526042',
    });
  }
}
