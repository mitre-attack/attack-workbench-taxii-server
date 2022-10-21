import { Module } from "@nestjs/common";
import { ObjectModule } from "../object/object.module";
import { PaginationModule } from "../pagination/pagination.module";
import { VersionService } from "./version.service";

@Module({
  imports: [PaginationModule, ObjectModule],
  providers: [VersionService],
  exports: [VersionService],
})
export class VersionModule {}
