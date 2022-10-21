import { StixRepositoryInterface } from "./stix.repository.interface";
import { StixObjectInterface } from "../interfaces/stix-object.interface";
import { StixBundleInterface } from "../interfaces/stix-bundle.interface";

export abstract class StixRepositoryAbstract
  implements StixRepositoryInterface
{
  // ** ALL METHODS SHOULD BE OVERRIDDEN ** //

  getAllStixObjects(
    excludeExtraneousValues?: boolean
  ): Promise<StixObjectInterface[]> {
    return;
  }
  getCollections(collectionId?: string): Promise<StixObjectInterface[]> {
    return;
  }
  getCollectionBundle(collectionId: string): Promise<StixBundleInterface> {
    return;
  }
  getAnObject(
    collectionId: string,
    stixId: string,
    versions: boolean
  ): Promise<StixObjectInterface[]> {
    return;
  }
}
