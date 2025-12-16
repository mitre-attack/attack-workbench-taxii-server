import { StixBundleDto } from '../dto/stix-bundle.dto';
import { StixBundleInterface } from '../interfaces/stix-bundle.interface';
import { StixObjectInterface } from '../interfaces/stix-object.interface';
import { StixRepositoryInterface } from './stix.repository.interface';

export abstract class StixRepositoryAbstract implements StixRepositoryInterface {
  // ** ALL METHODS SHOULD BE OVERRIDDEN ** //

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStixBundle(_domain: string, _version: '2.0' | '2.1'): Promise<StixBundleDto> {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAllStixObjects(_excludeExtraneousValues?: boolean): Promise<StixObjectInterface[]> {
    return;
  }

  getCollections(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _collectionId?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    versions?: 'all' | 'latest',
  ): Promise<StixObjectInterface[]> {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCollectionBundle(_collectionId: string, modified?: string): Promise<StixBundleInterface> {
    return;
  }

  getAnObject(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _collectionId: string,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _stixId: string,

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _versions: boolean,
  ): Promise<StixObjectInterface[]> {
    return;
  }
}
