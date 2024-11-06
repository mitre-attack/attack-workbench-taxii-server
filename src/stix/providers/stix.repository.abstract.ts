import { StixRepositoryInterface } from "./stix.repository.interface";
import { StixObjectInterface } from "../interfaces/stix-object.interface";
import { StixBundleInterface } from "../interfaces/stix-bundle.interface";
import { type StixBundle } from "@mitre-attack/attack-data-model";

export abstract class StixRepositoryAbstract implements StixRepositoryInterface {

  // ** ALL METHODS SHOULD BE OVERRIDDEN ** //

  getStixBundle(domain: string): Promise<StixBundle> { return; }

  getAllStixObjects(excludeExtraneousValues?: boolean): Promise<StixObjectInterface[]> { return; }

  getCollections(collectionId?: string): Promise<StixObjectInterface[]> { return; }

  getCollectionBundle(collectionId: string): Promise<StixBundleInterface> { return; }

  getAnObject(collectionId: string, stixId: string, versions: boolean): Promise<StixObjectInterface[]> { return; }
}
