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
    console.log('MediaType - Starting interception');
    return next.handle().pipe(
      map(data => {
        console.log('MediaType - Received data:', data);
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
