import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TaxiiBadRequestException, TaxiiNotAcceptableException } from '../../exceptions';
import { RequestContext, RequestContextModel } from '../request-context';
import { MediaTypeObject } from './media-type-object';
import { MEDIA_TYPE_TOKEN } from './constants';

@Injectable()
export class ContentNegotiationMiddleware implements NestMiddleware {
  private logger = new Logger(ContentNegotiationMiddleware.name);
  private readonly HEALTH_CHECK_PATH = '/health/ping';

  use(req: Request, res: Response, next: NextFunction) {
    const ctx: RequestContext = RequestContextModel.get();

    if (req.originalUrl.endsWith(this.HEALTH_CHECK_PATH)) {
      this.logger.debug(
        `[${ctx['x-request-id']}] Skipping content negotiation check on health check endpoint`,
      );
      return next();
    }

    // Extract 'Accept' header
    const mediaType: string = req.headers['accept'];

    if (typeof mediaType === 'undefined') {
      this.logger.error(`[${ctx['x-request-id']}] Request is missing Accept header.`);

      throw new TaxiiNotAcceptableException({
        title: 'Missing Accept header',
        description: 'The TAXII server requires an Accept header.',
      });
    }

    // If it exists, validate the media type
    if (mediaType) {
      try {
        // Instantiate the MediaTypeObject and write it to the Request object
        req[MEDIA_TYPE_TOKEN] = new MediaTypeObject(mediaType);

        // Validate the 'Accept' header
        this.validate(req);

        // If validation passes, proceed with the request
        return next();
      } catch (error) {
        this.logger.error(`[${ctx['x-request-id']}] Error processing media type: ${error.message}`);
        throw error;
      }
    }

    throw new TaxiiBadRequestException({
      title: 'Invalid media type',
      description:
        'The Accept header of the request must include a valid TAXII media type. Please see TAXII 2.1' +
        " specification 'Section 1.6.8 Content Negotiation' for a list of supported media types",
      externalDetails:
        'https://docs.oasis-open.org/cti/taxii/v2.1/csprd01/taxii-v2.1-csprd01.html#_Toc532988021',
    });
  }

  private validate(req: Request) {
    const ctx: RequestContext = RequestContextModel.get();
    const mediaType: MediaTypeObject = req[MEDIA_TYPE_TOKEN];

    // The validation is now handled in the MediaTypeObject constructor
    // We just need to check if we got a valid MediaTypeObject
    if (!mediaType || !(mediaType instanceof MediaTypeObject)) {
      this.logger.error(`[${ctx['x-request-id']}] Invalid media type object`);

      throw new TaxiiNotAcceptableException({
        title: 'Invalid Accept header',
        description: `The media type specified in the Accept header is invalid`,
      });
    }

    this.logger.debug(
      `[${ctx['x-request-id']}] The media type specified in the Accept header (${mediaType.toString()}) is valid`,
    );
  }
}
