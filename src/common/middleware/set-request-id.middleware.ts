import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v5 as uuidv5 } from 'uuid';
import * as stringify from 'json-stringify-safe';
import { randomUUID } from 'crypto';

/** Key used to store the request ID on the Express request object */
export const REQUEST_ID_TOKEN = 'x-request-id';

@Injectable()
export class SetRequestIdMiddleware implements NestMiddleware {
  private logger = new Logger(SetRequestIdMiddleware.name);

  /**
   * Middleware that generates a unique identifier (Type 5 UUID) for each HTTP request.
   * The ID is stored directly on the request object at req[REQUEST_ID_TOKEN].
   */
  use(req: Request, res: Response, next: NextFunction) {
    // Extract information from the request (for logging purposes)
    const { ip, method, originalUrl } = req;
    const userAgent = req.headers['user-agent'] || '';
    const accept = req.headers.accept || '';
    const contentType = req.headers['content-type'] || '';

    // Generate a unique ID and store it directly on the request object
    const reqId = this.generateRequestId(req);
    req[REQUEST_ID_TOKEN] = reqId;

    this.logger.log(
      `New request: [${reqId}] ${method} ${originalUrl} - ${accept} ${contentType} ${userAgent} ${ip}`,
    );

    next();
  }

  /**
   * Generates a Type 5 UUID for the request by hashing the stringified request with a random value.
   */
  private generateRequestId(req: Request): string {
    return uuidv5(stringify(req), randomUUID());
  }
}
