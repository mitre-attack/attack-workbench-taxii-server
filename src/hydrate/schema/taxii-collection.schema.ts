import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import * as mongoose from "mongoose";

@Schema()
export class WorkbenchCollectionEntity {

  @Prop({ type: mongoose.Schema.Types.String, required: false })
  id: string;

  @Prop({ type: mongoose.Schema.Types.String, required: false })
  title: string;

  @Prop(mongoose.Schema.Types.String)
  version: string;

  @Prop(mongoose.Schema.Types.Date)
  modified: Date;
}

export const WorkbenchCollectionSchema = SchemaFactory.createForClass(WorkbenchCollectionEntity);

@Schema()
export class MetaDataEntity {
  @Prop({ type: WorkbenchCollectionSchema })
  workbenchCollection: WorkbenchCollectionEntity;

  // Not set on collection-resource objects
  @Prop({ type: mongoose.Schema.Types.String, required: false })
  stixSpecVersion: string;

  @Prop(mongoose.Schema.Types.Date)
  createdAt: Date;
}

export const MetaDataSchema = SchemaFactory.createForClass(MetaDataEntity);

@Schema({
  collection: "collection-resources",
})
export class TaxiiCollectionEntity {
  @Prop({
    required: true,
    unique: true,
    message: "collection_id must be unique",
  })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  alias: string;

  @Prop({ required: true })
  canRead: boolean;

  @Prop({ required: true })
  canWrite: boolean;

  @Prop({ type: [String], required: false })
  mediaTypes: string[];

  @Prop({ type: MetaDataSchema })
  _meta: MetaDataEntity;
}

export type TaxiiCollectionDocument = TaxiiCollectionEntity & Document;

export const TaxiiCollectionSchema = SchemaFactory.createForClass(TaxiiCollectionEntity);