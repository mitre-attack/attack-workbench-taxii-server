import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RequestContext, RequestContextModel } from "./request-context";

@Injectable()
export class ResLoggerMiddleware implements NestMiddleware {
  private logger = new Logger(ResLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const ctx: RequestContext = RequestContextModel.get();
    const { ip, method, originalUrl } = req;
    const userAgent = req.headers["user-agent"] || "";

    res.on("finish", () => {
      const { statusCode } = res;
      const contentLength = res.get("content-length");

      this.logger.log(
        `Outgoing response: [${ctx["x-request-id"]}] ${statusCode} ${method} ${originalUrl} ${contentLength} - ${userAgent} ${ip}`
      );
    });

    next();
  }
}
