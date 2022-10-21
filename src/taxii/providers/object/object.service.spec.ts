import { Test, TestingModule } from "@nestjs/testing";
import { ObjectService } from "./object.service";
import { ObjectRepository } from "./object.repository";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { TaxiiConfigModule } from "src/config";
import { ObjectModule } from "./object.module";
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from "src/../test/test.mongoose.module";
import { MongooseModule } from "@nestjs/mongoose";
import { AttackObject, AttackObjectSchema } from "src/hydrate/collector/schema";
import { FilterModule } from "../filter/filter.module";

describe("ObjectService", () => {
  let objectService: ObjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        FilterModule,
        ObjectModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: AttackObject.name, schema: AttackObjectSchema },
        ]),
      ],
      providers: [ObjectService, ObjectRepository],
    }).compile();

    objectService = module.get(ObjectService);
  });

  it("should be defined", () => {
    expect(objectService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
