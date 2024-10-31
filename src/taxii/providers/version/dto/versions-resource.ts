import { ApiProperty, OmitType } from "@nestjs/swagger";
import { VersionDto } from "src/taxii/providers/version/dto/version.dto";

export class VersionsResource extends OmitType(VersionDto, ["next"]) {
  @ApiProperty({
    description:
      "This property identifies if there is more content available based on the search criteria. The absence of this property means the value is false.",
    required: false,
  })
  more: boolean;

  @ApiProperty({
    description:
      "The list of object versions returned by the request. If there are no versions returned, this key MUST be omitted, and the response is an empty object.",
    required: false,
  })
  versions: string[];
}
