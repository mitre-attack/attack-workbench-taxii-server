import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TaxiiCollectionDocument = TaxiiCollection & Document;

@Schema()
export class TaxiiCollection {
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
}

export const TaxiiCollectionSchema =
  SchemaFactory.createForClass(TaxiiCollection);
