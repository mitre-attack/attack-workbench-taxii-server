import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import {
  TaxiiBadRequestException,
  TaxiiNotAcceptableException,
} from "../../exceptions";
import { RequestContext, RequestContextModel } from "../request-context";
import { MediaTypeObject } from "./media-type-object";
import {
  SupportedMediaTypes,
  SupportedMediaSubTypes,
} from "./supported-media-types";
import { MEDIA_TYPE_TOKEN } from "./constants";

@Injectable()
export class ContentNegotiationMiddleware implements NestMiddleware {
  private logger = new Logger(ContentNegotiationMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Get a hook into the request context so we can do logging
    const ctx: RequestContext = RequestContextModel.get();

    // Extract 'Accept' header
    const mediaType: string = req.headers["accept"];

    if (typeof mediaType === "undefined") {
      this.logger.error(
        `[${ctx["x-request-id"]}] Request is missing Accept header.`
      );

      throw new TaxiiNotAcceptableException({
        title: "Missing Accept header",
        description: "The TAXII server requires an Accept header.",
      });
    }

    // If it exists, initialize a MediaTypeObject and store it on the request for later. Then check that the
    // 'Accept' header value is valid.
    if (mediaType) {
      // Instantiate the MediaTypeObject and write it to the Request object. Note that we use the MediaTypeObject to
      // facilitate string parsing on the 'Accept' value and to gain access to some helper methods.
      req[MEDIA_TYPE_TOKEN] = new MediaTypeObject(mediaType);

      // Validate the 'Accept' header
      this.validate(req);

      // If we make it this far, then 'Accept' header is valid and we can proceed with processing request
      return next();
    }

    // If the 'Accept' header is not found on the request, the TAXII server will throw a 'Bad Request' response
    throw new TaxiiBadRequestException({
      title: "Invalid media type",
      description:
        "The Accept header of the request must include a valid TAXII media type. Please see TAXII 2.1" +
        " specification 'Section 1.6.8 Content Negotiation' for a list of supported media types",
      externalDetails:
        "https://docs.oasis-open.org/cti/taxii/v2.1/csprd01/taxii-v2.1-csprd01.html#_Toc532988021",
    });
  }

  /**
   * TODO write JSDoc description
   * @param req
   * @private
   */
  private validate(req: Request) {
    // Get a hook into the request context so we can do logging
    const ctx: RequestContext = RequestContextModel.get();

    //const acceptHeader: string = req.headers["accept"];
    const mediaType: MediaTypeObject = req[MEDIA_TYPE_TOKEN];

    const isValid: boolean = this.isValidMediaType(mediaType);

    if (!isValid) {
      this.logger.error(
        `[${
          ctx["x-request-id"]
        }] The Request's Accept header (${mediaType.toString()}) is either missing the appropriate TAXII media type or the media type is invalid.`
      );

      throw new TaxiiNotAcceptableException({
        title: "Invalid Accept header",
        description: `The media type specified in the Accept header (${mediaType.toString()}) is invalid`,
      });
    }

    this.logger.debug(
      `[${
        ctx["x-request-id"]
      }] The media type specified in the Accept header (${mediaType.toString()}) is valid`
    );
  }

  /**
   * Determines whether a given MediaTypeObject appropriately conforms to the required Accept header media type as
   * defined by the TAXII 2.1 specification (section 1.6.8 Content Negotiation)
   * @param mediaType This is the MediaTypeObject whose type, subType, and option attributes will be validated
   * @private
   */
  private isValidMediaType(mediaType: MediaTypeObject): boolean {
    if (!(<any>Object).values(SupportedMediaTypes).includes(mediaType.type)) {
      return false;
    }

    if (
      !(<any>Object).values(SupportedMediaSubTypes).includes(mediaType.subType)
    ) {
      return false;
    }

    return true;
  }
}
