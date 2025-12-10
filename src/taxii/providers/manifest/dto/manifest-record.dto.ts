import { Expose } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { DEFAULT_CONTENT_TYPE } from 'src/common/middleware/content-negotiation/supported-media-types';

type StixCoreFields = {
  id: string;
  created: string | Date;
  modified?: string | Date;
};

export type ManifestRecordInput = StixCoreFields | { stix: StixCoreFields };

/**
 * The manifest-record type captures metadata about a single version of an object, indicated by the id property. The
 * metadata includes information such as when that version of the object was added to the Collection, the version of the
 * object itself, and the media type that this specific version of the object is available in.
 */
export class ManifestRecordDto {
  @Expose()
  @IsString()
  id: string;

  @Expose({ name: 'date_added' })
  @IsDate()
  dateAdded: Date;

  @Expose()
  @IsString()
  version: string;

  @Expose({ name: 'media_type' })
  @IsString()
  @IsOptional()
  mediaType?: string;

  constructor(input?: ManifestRecordInput) {
    if (!input) return;

    const src: StixCoreFields = 'stix' in input ? input.stix : input;

    this.id = src.id;

    // Use the created timestamp as a fallback date added value if dateAdded isn't explicitly set
    const createdDate = new Date(src.created);
    this.dateAdded = createdDate;

    // Use modified timestamp if available, otherwise use created timestamp
    const versionDate = src.modified ?? src.created;
    this.version = new Date(versionDate).toISOString();

    // Always set media type to STIX 2.1 by default
    this.mediaType = DEFAULT_CONTENT_TYPE;
  }
}
