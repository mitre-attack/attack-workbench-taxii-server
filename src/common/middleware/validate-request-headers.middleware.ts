import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { TaxiiNotAcceptableException } from "../exceptions";
import {
  MEDIATYPE_SUBTYPE_FIELD,
  MEDIATYPE_TYPE_FIELD,
  MEDIATYPE_OPTION_KEY_FIELD,
  MEDIATYPE_OPTION_VALUE_FIELD,
} from "../../constants";
import { RequestContext, RequestContextModel } from "./request-context";

class MediaTypeObject {
  type: string = null; // should equal "application"
  subType: string = null; // should equal "providers+json"
  optionKey: string = null; // should equal "version"
  optionValue: string = null; // should equal "2.1"

  get version() {
    return {
      key: this.optionKey,
      value: this.optionValue,
    };
  }

  toJSON() {
    return {
      type: this.type,
      subType: this.subType,
      option: {
        key: this.optionKey,
        value: this.optionValue,
      },
    };
  }
}

@Injectable()
export class ValidateRequestHeadersMiddleware implements NestMiddleware {
  private logger = new Logger(ValidateRequestHeadersMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // do validation
    this.validate(req);
    next();
  }

  private validate(req: Request) {
    const ctx: RequestContext = RequestContextModel.get();
    const acceptHeader: string = req.headers["accept"];
    const isValid: boolean = this.isValidAcceptHeader(acceptHeader);

    this.logger.debug(
      `[${ctx["x-request-id"]}] Request object contains Accept header: ${acceptHeader}`
    );
    this.logger.debug(
      `[${ctx["x-request-id"]}] Request Accept header (${acceptHeader}) is ${
        isValid ? "VALID" : "INVALID"
      }`
    );

    if (typeof acceptHeader === "undefined") {
      this.logger.error(
        `[${ctx["x-request-id"]}] Request is missing Accept header.`
      );

      throw new TaxiiNotAcceptableException({
        title: "Missing Accept header",
        description: "The TAXII server requires an Accept header.",
      });
    }

    // If the function has made it this far, that means that the accept header IS defined, so let's check
    // whether it is set correctly.

    if (!isValid) {
      this.logger
        .error(`[${ctx["x-request-id"]}] The request includes an Accept header but the header is either missing the ' +
                'appropriate TAXII media type or the media type is invalid.`);

      throw new TaxiiNotAcceptableException({
        title: "Invalid Accept header",
        description: `The media type provided (${acceptHeader}) in the Accept header is invalid`,
      });
    }
    // all checks passed, do nothing and let next() execute
  }

  /**
   * Determines whether the request's Accept header contains a valid TAXII media type
   * @param acceptHeader The entire Accept header in string format
   * @private
   */
  private isValidAcceptHeader(acceptHeader: string): boolean {
    /**
     * allDefinedMediaTypes will store all media type values passed in the request's Accept header. An Accept header
     * may pass multiple comma-separated media types!
     */
    const allDefinedMediaTypes: Array<MediaTypeObject> = [];
    /************************************************************************
     * Convert the Accept header from a string to an array of MediaTypeObjects
     ************************************************************************/
    acceptHeader.split(",").forEach((mediaType: string) => {
      allDefinedMediaTypes.push(this.parseMediaType(mediaType));
    });
    /************************************************************************
     * Ensure that at least one MediaTypeObject equals the TAXII–required
     * media type (application/providers+json;version=2.1)
     ************************************************************************/
    return allDefinedMediaTypes.some(this.isValidMediaType);
  }

  /**
   * Determines whether a given MediaTypeObject appropriately conforms to the required Accept header media type as
   * defined by the TAXII 2.1 specification (section 1.6.8 Content Negotiation)
   * @param mediaType This is the MediaTypeObject whose type, subType, and option attributes will be validated
   * @private
   */
  private isValidMediaType(mediaType: MediaTypeObject): boolean {
    let typeMatch: boolean = mediaType.type == MEDIATYPE_TYPE_FIELD;
    let subTypeMatch: boolean = mediaType.subType == MEDIATYPE_SUBTYPE_FIELD;

    if (typeMatch && subTypeMatch) {
      // type and subType match, so now we must determine if the version was specified
      if (mediaType.version) {
        // version is defined, so it must be correctly defined (despite being optional),
        // i.e. it must equal "version=2.1"

        return (
          mediaType.optionKey == MEDIATYPE_OPTION_KEY_FIELD &&
          mediaType.optionValue == MEDIATYPE_OPTION_VALUE_FIELD
        );
      }
      // The optional version field is undefined, but type and subType match so the Accept header is valid!
      return true;
    }
    return false;
  }

  /**
   * Converts a string-formatted media type to an instance of MediaTypeObject
   * @param mediaType A string-formatted RFC-6838 Media Type
   */
  private parseMediaType(mediaType: string): MediaTypeObject {
    // acceptObject will be returned later
    const mediaTypeObject = new MediaTypeObject();

    // EXAMPLE: String "application/providers+json;version=2.1" is converted to array ["application", "providers+json;version=2.1"]
    const typeAndSubType: string[] = mediaType.split("/");
    mediaTypeObject.type = typeAndSubType[0];

    if (typeAndSubType[1]) {
      // EXAMPLE: String "providers+json;version=2.1" is converted to array ["providers+json", "version=2.1"]
      const subTypeAndVersion: string[] = typeAndSubType[1].split(";");
      mediaTypeObject.subType = subTypeAndVersion[0];

      if (subTypeAndVersion[1]) {
        // "version=2.1" => ["version", "2.1"]
        const parsedVersion: string[] = subTypeAndVersion[1].split("=");
        mediaTypeObject.optionKey = parsedVersion[0] ? parsedVersion[0] : null;
        mediaTypeObject.optionValue = parsedVersion[1]
          ? parsedVersion[1]
          : null;
      }
    }
    return mediaTypeObject;
  }
}
