import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { StixObjectPropertiesInterface } from "../dto/interfaces/stix-object-properties.interface";

export type CollectionBundleDocument = CollectionBundle & Document;

@Schema()
export class CollectionBundle {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  objects: StixObjectPropertiesInterface[];
}

export const CollectionBundleSchema =
  SchemaFactory.createForClass(CollectionBundle);
