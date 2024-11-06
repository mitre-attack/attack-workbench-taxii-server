import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { StixProperties, StixPropertiesSchema } from "./stix-properties.schema";
import * as mongoose from "mongoose";

@Schema({
  collection: "object-resources",
  versionKey: false,
  /**
   * NOTE Until we integrate the attack-data-model to handle data parsing/validation, 
   * we need to disable strict mode to ensure that values passed to the model
   * constructor that are not specified in the schema can be saved to the db. Strict 
   * mode is just too prone to inadvertently dropping valid STIX properties.
   */
  strict: false
})
export class AttackObjectEntity extends Document {
  @Prop(mongoose.Schema.Types.String)
  collection_id: string;

  @Prop({ type: StixPropertiesSchema })
  stix: StixProperties;

  @Prop(mongoose.Schema.Types.Date)
  created_at: Date;
}

export type AttackObjectDocument = AttackObjectEntity & Document;

// Create the schema
export const AttackObjectSchema = SchemaFactory.createForClass(AttackObjectEntity);
