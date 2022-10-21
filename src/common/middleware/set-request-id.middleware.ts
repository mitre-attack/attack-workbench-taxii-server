import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { v5 as uuidv5 } from "uuid";
import * as stringify from "json-stringify-safe";
import { RequestContextModel, RequestContext } from "./request-context";
import { randomUUID } from "crypto";

@Injectable()
export class SetRequestIdMiddleware implements NestMiddleware {
  private logger = new Logger(SetRequestIdMiddleware.name);

  /**
   * Middleware that generates a unique identifier (Type 5 UUID) for each HTTP request.
   * @param req
   * @param res
   * @param next
   */
  use(req: Request, res: Response, next: NextFunction) {
    // Extract information from the request (for logging purposes)
    const { ip, method, originalUrl } = req;
    const userAgent = req.headers["user-agent"] || "";
    const accept = req.headers.accept || "";
    const contentType = req.headers["content-type"] || "";

    //* GENERATE UUID FOR EACH REQUEST *//
    const reqId: string = setUniqueIdentifier(req);

    this.logger.log(
      `New request: [${reqId}] ${method} ${originalUrl} - ${accept} ${contentType} ${userAgent} ${ip}`
    );

    // All done!
    next();
  }
}

/**
 * Sets a unique identifier on the request object
 * @param req Refers to an Express request object
 */
const setUniqueIdentifier = (req: Request): string => {
  // GENERATE A UUID: This program uses Type 5 UUIDs to uniquely identify each request. It hashes the concatenation of
  // the stringified request object with a random value. The random value gets prefixed to every stringified request
  // value to prevent name conflicts, which could arise if two identical request objects were processed.
  const uniqueID = uuidv5(stringify(req), randomUUID());

  const ctx: RequestContext = RequestContextModel.get();
  ctx["x-request-id"] = uniqueID;
  ctx.req = req;

  return uniqueID;
};
