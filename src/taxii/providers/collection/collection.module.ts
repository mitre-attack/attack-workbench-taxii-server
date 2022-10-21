import { Module } from "@nestjs/common";
import { CollectionService } from "./collection.service";
import { MongooseModule } from "@nestjs/mongoose";
import {
  TaxiiCollection,
  TaxiiCollectionSchema,
} from "src/hydrate/collector/schema";
import { StixModule } from "src/stix/stix.module";
import { CollectionRepository } from "./collection.repository";

@Module({
  imports: [
    StixModule,
    MongooseModule.forFeature([
      { name: TaxiiCollection.name, schema: TaxiiCollectionSchema },
    ]),
  ],
  providers: [CollectionService, CollectionRepository],
  exports: [CollectionService],
})
export class CollectionModule {}
