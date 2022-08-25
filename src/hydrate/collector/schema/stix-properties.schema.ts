import * as mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  strict: false,
  _id: false,
})
export class StixProperties {
  @Prop({ type: mongoose.Schema.Types.String })
  id: string;

  @Prop(mongoose.Schema.Types.Date)
  modified: Date;

  @Prop(mongoose.Schema.Types.Date)
  created: Date;

  @Prop(mongoose.Schema.Types.String)
  type: string;
}

export type WorkbenchStixObjectDocument = StixProperties & Document;

export const StixPropertiesSchema =
  SchemaFactory.createForClass(StixProperties);
