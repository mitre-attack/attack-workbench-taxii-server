import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { StixObjectPropertiesInterface } from "src/stix/dto/interfaces/stix-object-properties.interface";
import { Document } from "mongoose";

export type StixObjectDocument = StixObject & Document;

export class StixObject {
  @Prop({ required: true })
  stix: StixObjectPropertiesInterface;
}

export const StixObjectSchema = SchemaFactory.createForClass(StixObject);
