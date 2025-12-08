import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
import { Request, Response } from "express";
import {
  MEDIA_TYPE_TOKEN,
  MediaTypeObject,
} from "../middleware/content-negotiation";

/**
 * Automatically sets response Content-Type header based on the accepted media type.
 * For health check endpoints, uses application/json.
 * Prevents Express from adding charset=utf-8 to the Content-Type header.
 */
@Injectable()
export class SetResponseMediaType implements NestInterceptor {
  private readonly HEALTH_CHECK_PATH = "/health/ping";
  private readonly DEFAULT_CONTENT_TYPE = "application/json";

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // Determine the correct content type
    let contentType: string;
    if (req.originalUrl.endsWith(this.HEALTH_CHECK_PATH)) {
      contentType = this.DEFAULT_CONTENT_TYPE;
    } else {
      const requestedMediaType: MediaTypeObject = req[MEDIA_TYPE_TOKEN];
      contentType = requestedMediaType
        ? requestedMediaType.toString()
        : this.DEFAULT_CONTENT_TYPE;
    }

    // Override the json method to prevent Express from adding charset
    res.json = function (body: any) {
      res.setHeader("Content-Type", contentType);
      res.end(JSON.stringify(body));
      return res;
    };

    return next.handle().pipe(
      map((data) => {
        return data;
      }),
    );
  }
}
