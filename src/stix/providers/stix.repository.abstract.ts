import { StixRepositoryInterface } from './stix.repository.interface';
import { StixObjectInterface } from '../interfaces/stix-object.interface';
import { StixBundleInterface } from '../interfaces/stix-bundle.interface';
import { StixBundleDto } from '../dto/stix-bundle.dto';

export abstract class StixRepositoryAbstract implements StixRepositoryInterface {
  // ** ALL METHODS SHOULD BE OVERRIDDEN ** //

  getStixBundle(_domain: string, _version: '2.0' | '2.1'): Promise<StixBundleDto> {
    return;
  }

  getAllStixObjects(_excludeExtraneousValues?: boolean): Promise<StixObjectInterface[]> {
    return;
  }

  getCollections(_collectionId?: string): Promise<StixObjectInterface[]> {
    return;
  }

  getCollectionBundle(_collectionId: string): Promise<StixBundleInterface> {
    return;
  }

  getAnObject(
    _collectionId: string,

    _stixId: string,

    _versions: boolean,
  ): Promise<StixObjectInterface[]> {
    return;
  }
}
