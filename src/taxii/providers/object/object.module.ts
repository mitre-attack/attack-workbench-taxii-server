import { Module } from "@nestjs/common";
import { ObjectService } from "./object.service";
import { FilterModule } from "../filter/filter.module";
import { ObjectRepository } from "./object.repository";

@Module({
  imports: [FilterModule],
  providers: [ObjectService, ObjectRepository],
  exports: [ObjectService],
})
export class ObjectModule {}
