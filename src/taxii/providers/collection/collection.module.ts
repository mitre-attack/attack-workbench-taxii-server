import { Module } from "@nestjs/common";
import { CollectionService } from "./collection.service";
import { CollectionWorkbenchRepository } from "./collection.workbench.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { TaxiiCollection, TaxiiCollectionSchema } from "src/database/schema";
import { StixModule } from "src/stix/stix.module";
import { CollectionRepository } from "./collection.mongo.repository";

@Module({
  imports: [
    StixModule,
    MongooseModule.forFeature([
      { name: TaxiiCollection.name, schema: TaxiiCollectionSchema },
    ]),
  ],
  providers: [
    CollectionService,
    CollectionRepository,
    CollectionWorkbenchRepository,
  ],
  exports: [CollectionService],
})
export class CollectionModule {}
