import { ApiProperty, OmitType } from "@nestjs/swagger";
import { VersionDto } from "src/taxii/providers/version/dto/version.dto";

export class VersionsResource extends OmitType(VersionDto, ["versions", "next", "more"]) {
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
      "The list of object versions returned by the request. If there are no versions returned, this key MUST be omitted, and the response is an empty object.",
    type: [String],
    required: false,
  })
  versions: string[];
}