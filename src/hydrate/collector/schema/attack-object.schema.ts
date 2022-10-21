import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { StixProperties, StixPropertiesSchema } from "./stix-properties.schema";
import * as mongoose from "mongoose";

@Schema({
  collection: "object-resources",
  versionKey: false,
})
export class AttackObject extends Document {
  @Prop(mongoose.Schema.Types.String)
  collection_id: string;

  @Prop({ type: StixPropertiesSchema })
  stix: StixProperties;
}

export type AttackObjectDocument = AttackObject & Document;

// Create the schema
export const AttackObjectSchema = SchemaFactory.createForClass(AttackObject);
