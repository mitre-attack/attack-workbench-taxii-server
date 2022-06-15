export interface StixRepositoryInterface {
  getAllStixObjects();
  getCollections(collectionId?: string);
  getCollectionBundle(collectionId: string);
  getAnObject(collectionId: string, stixId: string, versions: boolean);
}
