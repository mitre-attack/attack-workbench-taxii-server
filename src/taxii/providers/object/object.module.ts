import { Module } from "@nestjs/common";
import { ObjectService } from "./object.service";
import { FilterModule } from "../filter/filter.module";
import { ObjectRepository } from "./object.repository";
import { MongooseModule } from "@nestjs/mongoose";
import {
  AttackObjectSchema,
  AttackObject,
} from "src/hydrate/collector/schema/attack-object.schema";

@Module({
  imports: [
    FilterModule,
    MongooseModule.forFeature([
      { name: AttackObject.name, schema: AttackObjectSchema },
    ]),
  ],
  providers: [ObjectService, ObjectRepository],
  exports: [ObjectService],
})
export class ObjectModule {}
