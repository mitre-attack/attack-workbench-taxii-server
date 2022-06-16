import { Test } from "@nestjs/testing";
import { CollectionService } from "./collection.service";
import { CollectionRepository} from "./collection.repository";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { TaxiiConfigModule } from "src/config";

it('can create an instance of CollectionService', async () => {

    // create a fake copy of the dependent services

    const fakeCollectionRepo = {
        findOne: (id: string) => {
            // fake findOne returns a fake instance of CollectionDto
            Promise.resolve({
                id,
                title: "fakeTitle",
                description: "fakeDescription",
                alias: "fakeAlias",
                canRead: true,
                canWrite: false,
                mediaType: []
            });
        },
        findAll: () => {
            // returns a fake (empty) instance of CollectionsDto
            Promise.resolve({
                collections: []
            });
        }
    }

    // create test DI container

    const module = await Test.createTestingModule({
        imports: [
            TaxiiLoggerModule,
            TaxiiConfigModule
        ],
        providers: [
            CollectionService,
            {
                provide: CollectionRepository,
                useValue: fakeCollectionRepo
            }
        ]
    }).compile();

    // reach into DI container and get a copy of the dependency services

    const collectionService = module.get(CollectionService);
    expect(collectionService).toBeDefined();
});