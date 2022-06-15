import { StixRepositoryInterface } from "./stix.repository.interface";
import { StixObjectInterface } from "../dto/interfaces/stix-object.interface";
import { StixBundleInterface } from "../dto/interfaces/stix-bundle.interface";

export abstract class StixRepositoryAbstract
  implements StixRepositoryInterface
{
  // ** ALL METHODS SHOULD BE OVERRIDDEN ** //

  getAllStixObjects(): Promise<StixObjectInterface[]> {
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
