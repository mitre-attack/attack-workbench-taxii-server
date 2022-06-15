import { Module } from "@nestjs/common";
import { ObjectModule } from "../object/object.module";
import { ManifestRecordService } from "./manifest-record.service";
import { PaginationModule } from "../pagination/pagination.module";
import { ManifestService } from "./manifest.service";

@Module({
  imports: [PaginationModule, ObjectModule],
  providers: [ManifestRecordService, ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
