import { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { StixProperties, StixPropertiesSchema } from "./stix-properties.schema";
import { MetaDataEntity, MetaDataSchema } from ".";


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
export class AttackObjectEntity {
  @Prop({ type: StixPropertiesSchema })
  stix: StixProperties;

  @Prop({ type: MetaDataSchema })
  _meta: MetaDataEntity;
}

export type AttackObjectDocument = AttackObjectEntity & Document;

export const AttackObjectSchema = SchemaFactory.createForClass(AttackObjectEntity);

AttackObjectSchema.index({ 'stix.created': 1 });