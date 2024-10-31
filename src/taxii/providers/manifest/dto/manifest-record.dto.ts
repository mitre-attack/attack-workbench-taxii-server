import { Expose } from "class-transformer";
import { IsDate, IsOptional, IsString } from "class-validator";
import { DEFAULT_CONTENT_TYPE } from "src/common/middleware/content-negotiation/supported-media-types";
import { StixObjectDto } from "src/stix/dto/stix-object.dto";

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

  constructor(stixObject: StixObjectDto) {
    if (!stixObject) return;

    this.id = stixObject.id;

    // The date and time this object was added.
    // TODO we are not currently this value, so we are using the created timestamp from the STIX object
    this.dateAdded = stixObject.created;

    // Use modified timestamp if available, otherwise use created timestamp
    const versionDate = stixObject.modified || stixObject.created;
    this.version = new Date(versionDate).toISOString();

    // Always set media type to STIX 2.1
    this.mediaType = DEFAULT_CONTENT_TYPE;
  }
}
