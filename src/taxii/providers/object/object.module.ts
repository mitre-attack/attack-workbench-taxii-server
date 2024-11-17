import { Module } from "@nestjs/common";
import { ObjectService } from "./object.service";
import { FilterModule } from "../filter/filter.module";
import { ObjectRepository } from "./object.repository";
import { MongooseModule } from "@nestjs/mongoose";
import {
  AttackObjectSchema,
  AttackObjectEntity,
} from "src/hydrate/schema/attack-object.schema";

@Module({
  imports: [
    FilterModule,
    MongooseModule.forFeature([
      { name: AttackObjectEntity.name, schema: AttackObjectSchema },
    ]),
  ],
  providers: [ObjectService, ObjectRepository],
  exports: [ObjectService],
})
export class ObjectModule {}
