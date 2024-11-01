import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable, tap } from "rxjs";
import { Request, Response } from "express";
import {
  MEDIA_TYPE_TOKEN,
  MediaTypeObject,
} from "../middleware/content-negotiation";

/**
 * Automatically sets response constants as defined in the `HeadersModel` enum.
 */
@Injectable()
export class SetResponseMediaType implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        const requestedMediaType: MediaTypeObject = req[MEDIA_TYPE_TOKEN];
        const contentType = requestedMediaType.toString();

        res.setHeader("Content-Type", contentType);

        // Important: Return the data!
        return data;
      })
    );
  }
}
