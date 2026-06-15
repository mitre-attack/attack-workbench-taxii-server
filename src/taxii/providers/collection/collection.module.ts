import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxiiCollectionEntity, TaxiiCollectionSchema } from 'src/hydrate/schema';
import { StixModule } from 'src/stix/stix.module';
import { ReleaseModule } from '../release';
import { CollectionRepository } from './collection.repository';

@Module({
  imports: [
    StixModule,
    ReleaseModule,
    MongooseModule.forFeature([
      { name: TaxiiCollectionEntity.name, schema: TaxiiCollectionSchema },
    ]),
  ],
  providers: [CollectionService, CollectionRepository],
  exports: [CollectionService],
})
export class CollectionModule {}
