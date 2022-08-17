import { Inject, Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { WorkbenchCollectionBundleDto } from "src/stix/dto/workbench-collection-bundle.dto";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryInterface } from "src/stix/providers/stix.repository.interface";

@Injectable()
export class ObjectWorkbenchRepository {
  /**
   * Instantiates an instance of the ObjectRepository service class
   * @param logger
   * @param stixRepo
   */
  constructor(
    private readonly logger: Logger,
    @Inject(STIX_REPO_TOKEN) private readonly stixRepo: StixRepositoryInterface
  ) {
    logger.setContext(ObjectWorkbenchRepository.name);
  }

  /**
   * Gets an array of all available STIX objects. This method is collection-agnostic.
   */
  // TODO implement this method
  async findAll(): Promise<StixObjectInterface[]> {
    return await this.stixRepo.getAllStixObjects();
  }

  /**
   * Gets all STIX objects in a given collection
   * @param collectionId The unique identifier of the STIX collection
   */
  // async findByCollection(collectionId: string): Promise<StixBundleInterface> {
  async findByCollection(
    collectionId: string
  ): Promise<WorkbenchCollectionBundleDto> {
    return await this.stixRepo.getCollectionBundle(collectionId);
  }

  /**
   * Get the latest version of a STIX object
   * @param collectionId Collection identifier of the requested STIX object
   * @param objectId Identifier of the requested object
   * @param versions
   */
  async findOne(
    collectionId: string,
    objectId: string,
    versions = false
  ): Promise<StixObjectInterface[]> {
    return await this.stixRepo.getAnObject(collectionId, objectId, versions);
  }
}
