import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
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
      tap(() => {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();

        const requestedMediaType: MediaTypeObject = req[MEDIA_TYPE_TOKEN];

        // requestedMediaType._subType = requestedMediaType._subType.replace(
        //   "taxii",
        //   "stix"
        // );

        const contentType = requestedMediaType.toString();

        contentType.replace("taxii", "stix");

        res.setHeader("Content-Type", contentType);
      })
    );
  }
}
