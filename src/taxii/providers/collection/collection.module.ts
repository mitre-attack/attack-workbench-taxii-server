import { Module } from "@nestjs/common";
import { CollectionService } from "./collection.service";
import { CollectionWorkbenchRepository } from "./collection.workbench.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { TaxiiCollection, TaxiiCollectionSchema } from "./schema";
import { StixModule } from "src/stix/stix.module";
// import { CollectionCollectorService } from "src/stix/providers/resource-collectors/collection-collector.service";

@Module({
  imports: [
    StixModule,
    MongooseModule.forFeature([
      { name: TaxiiCollection.name, schema: TaxiiCollectionSchema },
    ]),
  ],
  providers: [
    CollectionService,
    CollectionWorkbenchRepository,
    // CollectionCollectorService,
  ],
  exports: [CollectionService],
})
export class CollectionModule {}
