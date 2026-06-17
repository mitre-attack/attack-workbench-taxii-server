import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class CollectionReleaseEntity {
  @Prop({ type: mongoose.Schema.Types.String, required: true })
  version: string;

  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  modified: Date;
}

export const CollectionReleaseSchema = SchemaFactory.createForClass(CollectionReleaseEntity);

@Schema()
export class CollectionMetaDataEntity {
  @Prop({ type: CollectionReleaseSchema, required: true })
  release: CollectionReleaseEntity;

  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  createdAt: Date;
}

export const CollectionMetaDataSchema = SchemaFactory.createForClass(CollectionMetaDataEntity);

@Schema({
  collection: 'collection-resources',
})
export class TaxiiCollectionEntity {
  @Prop({
    required: true,
    unique: false, // Not unique on its own: the same collection ID exists once per release
    type: mongoose.Schema.Types.String,
  })
  id: string;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  title: string;

  @Prop({ type: mongoose.Schema.Types.String, required: false })
  description: string;

  @Prop({ type: mongoose.Schema.Types.String, required: false })
  alias: string;

  @Prop({ type: mongoose.Schema.Types.Boolean, required: true })
  canRead: boolean;

  @Prop({ type: mongoose.Schema.Types.Boolean, required: true })
  canWrite: boolean;

  @Prop({ type: [String], required: false })
  mediaTypes: string[];

  @Prop({ type: CollectionMetaDataSchema, required: true })
  _meta: CollectionMetaDataEntity;
}

export type TaxiiCollectionDocument = TaxiiCollectionEntity & Document;

export const TaxiiCollectionSchema = SchemaFactory.createForClass(TaxiiCollectionEntity);

// One collection document per (collection, release) pair. Doubles as the hydration commit marker:
// the document is written only after all of the release's objects, so its presence means the
// release is fully hydrated, and the unique constraint makes additive hydration idempotent.
TaxiiCollectionSchema.index(
  { id: 1, '_meta.release.version': 1 },
  {
    background: true,
    unique: true,
    name: 'taxii_collection_release_lookup',
  },
);
