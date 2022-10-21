import { Module } from "@nestjs/common";
import { ObjectModule } from "../object";
import { PaginationModule } from "../pagination";
import { ManifestService } from "./manifest.service";

@Module({
  imports: [PaginationModule, ObjectModule],
  providers: [ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
