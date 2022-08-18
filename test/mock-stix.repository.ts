import { StixRepositoryInterface } from "../src/stix/providers/stix.repository.interface";
import { StixObjectInterface } from "../src/stix/interfaces/stix-object.interface";
import { StixBundleInterface } from "../src/stix/interfaces/stix-bundle.interface";

export class MockStixRepository implements StixRepositoryInterface {
  getAllStixObjects(): StixObjectInterface[] {
    return [
      { stix: { id: "1", created: "01-01-1999", modified: "01-01-1999" } },
      { stix: { id: "2", created: "01-01-1999", modified: "01-01-1999" } },
      { stix: { id: "3", created: "02-02-1999", modified: "01-01-1999" } },
      { stix: { id: "4", created: "02-02-1999", modified: "01-01-1999" } },
      { stix: { id: "5", created: "03-03-1999", modified: "01-01-1999" } },
      { stix: { id: "6", created: "03-03-1999", modified: "01-01-1999" } },
      { stix: { id: "7", created: "04-04-1999", modified: "01-01-1999" } },
    ];
  }

  getAnObject(
    collectionId: string,
    stixId: string,
    versions: boolean
  ): StixObjectInterface[] {
    if (versions) {
      return [
        { stix: { id: "1", created: "01-01-1999", modified: "01-01-1999" } },
        { stix: { id: "1", created: "01-01-2000", modified: "01-01-2000" } },
      ];
    }
    return [
      { stix: { id: "1", created: "01-01-2000", modified: "01-01-2000" } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCollectionBundle(collectionId: string): StixBundleInterface {
    return {
      type: "collection-bundle",
      id: "1",
      objects: [
        { id: "1", created: "01-01-1999" },
        { id: "2", created: "01-01-1999" },
        { id: "3", created: "01-01-1999" },
        { id: "4", created: "01-01-1999" },
        { id: "5", created: "01-01-1999" },
        { id: "6", created: "01-01-1999" },
        { id: "7", created: "01-01-1999" },
      ],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCollections(collectionId?: string): StixObjectInterface[] {
    return [
      { stix: { id: "1", type: "stix", created: "01-01-1999" } },
      { stix: { id: "2", type: "stix", created: "02-02-1999" } },
      { stix: { id: "3", type: "stix", created: "03-03-1999" } },
    ];
  }
}
