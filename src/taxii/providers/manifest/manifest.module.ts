import { Module } from "@nestjs/common";
import { ObjectModule } from "../object";
import { ManifestRecordService } from "./manifest-record.service";
import { PaginationModule } from "../pagination";
import { ManifestService } from "./manifest.service";

@Module({
  imports: [PaginationModule, ObjectModule],
  providers: [ManifestRecordService, ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
