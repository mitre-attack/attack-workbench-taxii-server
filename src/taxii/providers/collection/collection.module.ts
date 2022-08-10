import { Module } from "@nestjs/common";
import { CollectionService } from "./collection.service";
import { CollectionRepository } from "./collection.repository";
import { MongooseModule } from "@nestjs/mongoose";
import {
  TaxiiCollection,
  TaxiiCollectionSchema,
} from "./schema/taxii-collection.schema";
import { CollectionCronService } from "./collection.cron";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaxiiCollection.name, schema: TaxiiCollectionSchema },
    ]),
  ],
  providers: [CollectionService, CollectionRepository, CollectionCronService],
  exports: [CollectionService],
})
export class CollectionModule {}
