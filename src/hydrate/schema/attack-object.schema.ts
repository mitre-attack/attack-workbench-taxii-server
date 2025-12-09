import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { StixProperties, StixPropertiesSchema } from './stix-properties.schema';

@Schema()
export class CollectionRefEntity {
  @Prop({ type: mongoose.Schema.Types.String, required: true })
  id: string;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  title: string;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  version: string;

  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  modified: Date;
}

export const CollectionRefSchema = SchemaFactory.createForClass(CollectionRefEntity);

@Schema()
export class ObjectMetaDataEntity {
  @Prop({ type: CollectionRefSchema, required: true })
  collectionRef: CollectionRefEntity;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  stixSpecVersion: string;

  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  createdAt: Date;

  @Prop({ type: mongoose.Schema.Types.Boolean, required: true, default: true })
  active: boolean;
}

export const ObjectMetaDataSchema = SchemaFactory.createForClass(ObjectMetaDataEntity);

@Schema({
  collection: 'object-resources',
  versionKey: false,
  /**
   * NOTE Until we integrate the attack-data-model to handle data parsing/validation,
   * we need to disable strict mode to ensure that values passed to the model
   * constructor that are not specified in the schema can be saved to the db. Strict
   * mode is just too prone to inadvertently dropping valid STIX properties.
   */
  strict: false,
})
export class AttackObjectEntity {
  @Prop({ type: StixPropertiesSchema })
  stix: StixProperties;

  @Prop({ type: ObjectMetaDataSchema, required: true })
  _meta: ObjectMetaDataEntity;
}

export type AttackObjectDocument = AttackObjectEntity & Document;

export const AttackObjectSchema = SchemaFactory.createForClass(AttackObjectEntity);

// Index for TAXII-compliant sorting
AttackObjectSchema.index({ '_meta.createdAt': 1 }, { background: true });

// Required for TAXII-compliant object sorting
AttackObjectSchema.index(
  { '_meta.createdAt': 1 },
  {
    background: true,
    name: 'taxii_object_sorting',
  },
);

// Required for "Get Objects" endpoint
AttackObjectSchema.index(
  {
    '_meta.collectionRef.id': 1,
    '_meta.active': 1,
  },
  {
    background: true,
    name: 'taxii_objects_by_collection',
  },
);

// Required for "Get An Object" endpoint
AttackObjectSchema.index(
  {
    '_meta.collectionRef.id': 1,
    'stix.id': 1,
    '_meta.active': 1,
  },
  {
    background: true,
    name: 'taxii_object_lookup',
  },
);
