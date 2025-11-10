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
 */
@Injectable()
export class SetResponseMediaType implements NestInterceptor {
  private readonly HEALTH_CHECK_PATH = "/health/ping";
  private readonly DEFAULT_CONTENT_TYPE = "application/json";

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();

        // Set content type based on path
        if (req.originalUrl.endsWith(this.HEALTH_CHECK_PATH)) {
          res.setHeader("Content-Type", this.DEFAULT_CONTENT_TYPE);
        } else {
          const requestedMediaType: MediaTypeObject = req[MEDIA_TYPE_TOKEN];
          if (requestedMediaType) {
            res.setHeader("Content-Type", requestedMediaType.toString());
          } else {
            // Fallback in case MEDIA_TYPE_TOKEN is not set
            res.setHeader("Content-Type", this.DEFAULT_CONTENT_TYPE);
          }
        }

        return data;
      }),
    );
  }
}
