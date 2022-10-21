import { Test, TestingModule } from "@nestjs/testing";
import { PaginationService } from "../pagination";
import { ObjectModule } from "../object";
import { VersionService } from "./version.service";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { TaxiiConfigModule } from "src/config";
import { MongooseModule } from "@nestjs/mongoose";
import {
  rootMongooseTestModule,
  closeInMongodConnection,
} from "src/../test/test.mongoose.module";
import { AttackObject, AttackObjectSchema } from "src/hydrate/collector/schema";

describe("VersionService", () => {
  let versionService: VersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        ObjectModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: AttackObject.name, schema: AttackObjectSchema },
        ]),
      ],
      providers: [VersionService, PaginationService],
    }).compile();

    versionService = module.get<VersionService>(VersionService);
  });

  it("should be defined", () => {
    expect(versionService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
