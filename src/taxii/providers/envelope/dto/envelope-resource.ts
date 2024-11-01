import { ApiProperty } from "@nestjs/swagger";
import { OmitType } from "@nestjs/swagger";
import { EnvelopeDto } from "./envelope.dto";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
import { StixObjectDto } from "src/stix/dto/stix-object.dto";

export class EnvelopeResource extends OmitType(EnvelopeDto, [
  "next",
  "objects",
]) {
  @ApiProperty({
    description:
      "This property identifies if there is more content available based on the search criteria. The absence of this property means the value is false.",
    type: Boolean,
    required: false,
  })
  more: boolean;

  @ApiProperty({
    description:
      "This property identifies the server provided value of the next record or set of records in the paginated data set. This property MAY be populated if the more property is set to true.\n\n \n\nThis value is opaque to the client and represents something that the server knows how to deal with and process.\n\n \n\nFor example, for a relational database this could be the index autoID, for elastic search it could be the Scroll ID, for other systems it could be a cursor ID, or it could be any string (or int represented as a string) depending on the requirements of the server and what it is doing in the background.",
    type: String,
    required: false,
  })
  next: string;

  @ApiProperty({
    description:
      "This property contains one or more STIX Objects. Objects in this list MUST be a STIX Object (e.g., SDO, SCO, SRO, Language Content object, or a Marking Definition object).",
    type: [StixObjectDto],
    required: false,
  })
  objects: StixObjectPropertiesInterface[];
}
