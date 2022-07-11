import { Test } from "@nestjs/testing";
import { ManifestRecordService } from "./manifest-record.service";

it("can create an instance of ManifestRecordService", async () => {
  const module = await Test.createTestingModule({
    providers: [ManifestRecordService],
  }).compile();

  const manifestRecordService = module.get(ManifestRecordService);
  expect(manifestRecordService).toBeDefined();
});
