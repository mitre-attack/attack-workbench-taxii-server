import { SupportedMediaVersion } from "./supported-media-types";
import { TaxiiBadRequestException } from "../../exceptions";

export interface ParsedMediaTypeFields {
  type;
  subType;
  version;
}

export class MediaTypeObject {
  _type: string;
  _subType: string;
  _version: string;

  /**
   * Converts a string-formatted media type to an instance of MediaTypeObject
   * @param mediaType A string-formatted RFC-6838 Media Type
   */
  constructor(acceptHeader: string) {
    const parsed: ParsedMediaTypeFields =
      MediaTypeObject.parseAcceptHeader(acceptHeader);
    this._type = parsed.type;
    this._subType = parsed.subType;
    this._version = parsed.version;
  }

  get type(): string {
    return this._type;
  }

  get subType(): string {
    return this._subType;
  }

  get version(): string {
    return this._version;
  }

  toString(): string {
    if (this._version) {
      return `${this._type}/${this._subType};version=${this._version}`;
    }
    return `${this._type}/${this._subType}`;
  }

  toJSON(): ParsedMediaTypeFields {
    return {
      type: this._type,
      subType: this._subType,
      version: this._version,
    };
  }

  private static parseAcceptHeader(
    acceptHeader: string
  ): ParsedMediaTypeFields {
    // parsed object will be returned
    const parsed = {} as ParsedMediaTypeFields;

    // EXAMPLE:
    // String "application/providers+json;version=2.1" is converted to
    // array ["application", "providers+json;version=2.1"]
    const typeAndSubType: string[] = acceptHeader.split("/");
    parsed.type = typeAndSubType[0];

    if (typeAndSubType[1]) {
      // EXAMPLE: String "providers+json;version=2.1" is converted to array ["providers+json", "version=2.1"]
      const subTypeAndVersion: string[] = typeAndSubType[1].split(";");
      parsed.subType = subTypeAndVersion[0];

      if (subTypeAndVersion[1]) {
        // "version=2.1" => ["version", "2.1"]
        const parsedVersion: string[] = subTypeAndVersion[1].split("=");

        if (parsedVersion[0] === "version") {
          // set version
          switch (parsedVersion[1]) {
            case "2.1":
              parsed.version = SupportedMediaVersion.V21;
              break;
            default:
              throw new TaxiiBadRequestException({
                title: "Unsupported Media Type",
                description: `${parsedVersion[1]} detected in the Accept header is not a supported media type version`,
              });
          }
        }
      } else {
        // This else block will execute if user did not specify a version, i.e., "application/taxii+json"
        // In this case, we set the requested media type to the latest version
        parsed.version = SupportedMediaVersion.LATEST;
      }
    }
    return parsed;
  }
}
