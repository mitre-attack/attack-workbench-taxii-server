import { Test, TestingModule } from "@nestjs/testing";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { TaxiiConfigModule } from "src/config";
import { EnvelopeService } from "./envelope.service";
import { PaginationService } from "../pagination";
import { ObjectService } from "../object";
import { FilterService } from "../filter";
import { ObjectRepository } from "../object/object.repository";
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from "src/../test/test.mongoose.module";
import { MongooseModule } from "@nestjs/mongoose";
import { AttackObjectEntity, AttackObjectSchema } from "src/hydrate/schema";

describe("EnvelopeService", () => {
  let envelopeService: EnvelopeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: AttackObjectEntity.name, schema: AttackObjectSchema },
        ]),
      ],
      providers: [
        EnvelopeService,
        PaginationService,
        ObjectService,
        ObjectRepository,
        FilterService,
      ],
    }).compile();
    envelopeService = module.get<EnvelopeService>(EnvelopeService);
  });

  it("should be defined", async () => {
    expect(envelopeService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
