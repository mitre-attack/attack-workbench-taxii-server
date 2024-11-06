export interface StixRepositoryInterface {
  getStixBundle(domain: string);
  getAllStixObjects(excludeExtraneousValues?: boolean);
  getCollections(collectionId?: string);
  getCollectionBundle(collectionId: string);
  getAnObject(collectionId: string, stixId: string, versions: boolean);
}
