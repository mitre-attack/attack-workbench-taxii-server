import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import * as mongoose from "mongoose";

@Schema()
export class WorkbenchCollectionEntity {
  @Prop({ type: mongoose.Schema.Types.String, required: true })
  version: string;

  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  modified: Date;
}

export const WorkbenchCollectionSchema = SchemaFactory.createForClass(WorkbenchCollectionEntity);

@Schema()
export class CollectionMetaDataEntity {
  @Prop({ type: WorkbenchCollectionSchema, required: true })
  workbenchCollection: WorkbenchCollectionEntity;

  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  createdAt: Date;

  @Prop({ type: mongoose.Schema.Types.Boolean, required: true, default: true })
  active: boolean;
}

export const CollectionMetaDataSchema = SchemaFactory.createForClass(CollectionMetaDataEntity);

@Schema({
  collection: "collection-resources",
})
export class TaxiiCollectionEntity {
  @Prop({
    required: true,
    unique: false, // Changed to false since same ID can exist across versions
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

// Required for "Get A Collection" endpoint
TaxiiCollectionSchema.index(
  { id: 1, '_meta.active': 1 },
  {
    background: true,
    name: 'taxii_collection_lookup'
  }
);

// Required for collision detection in hydration
TaxiiCollectionSchema.index(
  { title: 1, '_meta.active': 1 },
  {
    background: true,
    name: 'collection_title_lookup'
  }
);