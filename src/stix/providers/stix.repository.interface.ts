export interface StixRepositoryInterface {
  getStixBundle(domain: string, version: '2.0' | '2.1');
  getAllStixObjects(excludeExtraneousValues?: boolean);
  getCollections(collectionId?: string, versions?: 'all' | 'latest');
  getCollectionBundle(collectionId: string, modified?: string);
  getAnObject(collectionId: string, stixId: string, versions: boolean);
}
