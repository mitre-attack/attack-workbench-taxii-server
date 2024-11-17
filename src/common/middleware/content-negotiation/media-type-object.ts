import { TaxiiBadRequestException } from "src/common/exceptions";
import { SupportedMediaTypes, SupportedMediaSubTypes, SupportedMediaVersion } from "./supported-media-types";

export interface ParsedMediaTypeFields {
  type: SupportedMediaTypes;
  subType: SupportedMediaSubTypes;
  version: string;
}

export class MediaTypeObject {
  private _type: SupportedMediaTypes;
  private _subType: SupportedMediaSubTypes;
  private _version: string;

  /**
   * Converts a string-formatted media type to an instance of MediaTypeObject
   * @param mediaType A string-formatted RFC-6838 Media Type
   */
  constructor(acceptHeader: string) {
    const parsed: ParsedMediaTypeFields = MediaTypeObject.parseAcceptHeader(acceptHeader);
    this._type = parsed.type;
    this._subType = parsed.subType;
    this._version = parsed.version;
  }

  get type(): SupportedMediaTypes {
    return this._type;
  }

  get subType(): SupportedMediaSubTypes {
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

  private static parseAcceptHeader(acceptHeader: string): ParsedMediaTypeFields {
    const parsed = {} as ParsedMediaTypeFields;

    const typeAndSubType: string[] = acceptHeader.split("/");

    // Validate and convert type to enum
    if (!Object.values(SupportedMediaTypes).includes(typeAndSubType[0] as SupportedMediaTypes)) {
      throw new TaxiiBadRequestException({
        title: "Unsupported Media Type",
        description: `${typeAndSubType[0]} is not a supported media type`,
      });
    }
    parsed.type = typeAndSubType[0] as SupportedMediaTypes;

    if (typeAndSubType[1]) {
      const subTypeAndVersion: string[] = typeAndSubType[1].split(";");

      // Validate and convert subType to enum
      if (!Object.values(SupportedMediaSubTypes).includes(subTypeAndVersion[0] as SupportedMediaSubTypes)) {
        throw new TaxiiBadRequestException({
          title: "Unsupported Media SubType",
          description: `${subTypeAndVersion[0]} is not a supported media subtype`,
        });
      }
      parsed.subType = subTypeAndVersion[0] as SupportedMediaSubTypes;

      if (subTypeAndVersion[1]) {
        const parsedVersion: string[] = subTypeAndVersion[1].split("=");

        if (parsedVersion[0] === "version") {
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
        parsed.version = SupportedMediaVersion.LATEST;
      }
    }
    return parsed;
  }
}