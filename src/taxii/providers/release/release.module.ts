import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReleasePointerEntity,
  ReleasePointerSchema,
  TaxiiCollectionEntity,
  TaxiiCollectionSchema,
} from 'src/hydrate/schema';
import { ReleaseParamPipe } from './release-param.pipe';
import { ReleaseService } from './release.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaxiiCollectionEntity.name, schema: TaxiiCollectionSchema },
      { name: ReleasePointerEntity.name, schema: ReleasePointerSchema },
    ]),
  ],
  providers: [ReleaseService, ReleaseParamPipe],
  exports: [ReleaseService, ReleaseParamPipe],
})
export class ReleaseModule {}
