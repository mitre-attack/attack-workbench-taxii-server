import { Module } from "@nestjs/common";
import { ObjectCollectorService } from "./providers/object-collector.service";
import { CollectionCollectorService } from "./providers/collection-collector.service";
import { MongooseModule } from "@nestjs/mongoose";
import { AttackObjectEntity, AttackObjectSchema } from "./schema";
import { TaxiiCollection, TaxiiCollectionSchema } from "./schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AttackObjectEntity.name, schema: AttackObjectSchema },
      { name: TaxiiCollection.name, schema: TaxiiCollectionSchema },
    ]),
  ],
  providers: [ObjectCollectorService, CollectionCollectorService],
  exports: [ObjectCollectorService, CollectionCollectorService],
})
export class CollectorModule {}
