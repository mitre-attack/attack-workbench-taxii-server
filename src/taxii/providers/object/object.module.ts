import { Module } from "@nestjs/common";
import { ObjectService } from "./object.service";
import { FilterModule } from "../filter/filter.module";
import { ObjectWorkbenchRepository } from "./object.workbench.repository";
import { ObjectMongoRepository } from "./object.mongo.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { CollectionModule } from "../collection";
import {
  AttackObjectSchema,
  AttackObject,
} from "src/stix/schema/attack-object.schema";
import { StixModule } from "src/stix/stix.module";
import { ObjectCollectorService } from "src/stix/providers/resource-collectors/object-collector.service";

@Module({
  imports: [
    StixModule,
    FilterModule,
    MongooseModule.forFeature([
      { name: AttackObject.name, schema: AttackObjectSchema },
    ]),
    CollectionModule,
  ],
  providers: [
    ObjectService,
    ObjectWorkbenchRepository,
    ObjectMongoRepository,
    ObjectCollectorService,
  ],
  exports: [ObjectService],
})
export class ObjectModule {}
