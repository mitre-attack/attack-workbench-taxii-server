import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { StixProperties, StixPropertiesSchema } from "./stix-properties.schema";
import * as mongoose from "mongoose";
// import { Expose, Type } from "class-transformer";
// import { WorkbenchStixObjectPropertiesDto } from "../dto/workbench-stix-object-properties.dto";

@Schema({
  collection: "attackObjects",
  versionKey: false,
})
export class AttackObject extends Document {
  @Prop(mongoose.Schema.Types.String)
  collection_id: string;

  // TODO determine if DTO classes should combine with schema classes
  //@Expose()
  //@Type(() => WorkbenchStixObjectPropertiesDto)
  @Prop({ type: StixPropertiesSchema })
  stix: StixProperties;
}

export type AttackObjectDocument = AttackObject & Document;

// Create the schema
export const AttackObjectSchema = SchemaFactory.createForClass(AttackObject);
