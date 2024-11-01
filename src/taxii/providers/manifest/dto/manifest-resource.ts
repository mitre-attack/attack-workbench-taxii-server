import { ApiProperty, OmitType } from "@nestjs/swagger";
import { ManifestDto } from "./manifest.dto";
import { ManifestRecordDto } from "./manifest-record.dto";
import { ManifestRecordResource } from "./manifest-record-resource";

export class ManifestResource extends OmitType(ManifestDto, ["objects"]) {
  @ApiProperty({
    description:
      "This property identifies if there is more content available based on the search criteria. The absence of this property means the value is false.",
    type: Boolean,
    required: false,
  })
  more: boolean;

  @ApiProperty({
    description:
      "This property provides a reference to the next page if there is more content available based on the search criteria. The absence of this property means no additional pages exist based on the search criteria.",
    type: String,
    required: false,
  })
  next: string;

  @ApiProperty({
    description:
      "The list of manifest entries for objects returned by the request. If there are no manifest-record objects in the list, this key MUST be omitted, and the response is an empty object.",
    type: [ManifestRecordResource],
    required: false,
  })
  objects: ManifestRecordDto[];
}
