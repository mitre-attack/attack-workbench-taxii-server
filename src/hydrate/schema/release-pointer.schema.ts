import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

/**
 * Tracks the latest release of each collection. The default API root (e.g. api/v21) resolves
 * "latest" through these pointers rather than through a per-document active flag.
 *
 * A dedicated pointer document is required because release version strings do not sort
 * lexicographically ("9.0" > "19.1"); HydrateService selects the latest release by its modified
 * timestamp, which is totally ordered. The pointer is flipped only after a release is fully
 * hydrated, so clients never observe a partially-written release through the default root.
 */
@Schema({
  collection: 'latest-release-pointers',
})
export class ReleasePointerEntity {
  // STIX identifier of the x-mitre-collection object, e.g. "x-mitre-collection--1f5f1533-..."
  @Prop({ type: mongoose.Schema.Types.String, required: true, unique: true })
  collectionId: string;

  // The latest release version of the collection, e.g. "19.1"
  @Prop({ type: mongoose.Schema.Types.String, required: true })
  version: string;

  // Publication timestamp of the latest release
  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  modified: Date;

  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  updatedAt: Date;
}

export type ReleasePointerDocument = ReleasePointerEntity & Document;

export const ReleasePointerSchema = SchemaFactory.createForClass(ReleasePointerEntity);
