import { Exclude, Expose, Type } from "class-transformer";
import { IsString } from "class-validator";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";

/**
 * The manifest-record type captures metadata about a single version of an object, indicated by the id property. The
 * metadata includes information such as when that version of the object was added to the Collection, the version of the
 * object itself, and the media type that this specific version of the object is available in.
 */
@Exclude()
export class ManifestRecordDto {
  @IsString()
  @Expose()
  id: string;

  @Type(() => String)
  @Expose({ name: "date_added" })
  dateAdded: string;

  @IsString()
  @Expose()
  version: string;

  @IsString()
  @Expose({ name: "media_type" })
  mediaType: string;

  constructor(stixObject: StixObjectPropertiesInterface) {
    this.id = stixObject.id;
    this.dateAdded = stixObject.created;
    this.mediaType = "application/stix+taxii;version=2.1";
    this.version = stixObject.modified;
  }
}
