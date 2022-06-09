import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";
import {Observable, tap} from "rxjs";
import {Response} from "express";
import { DEFAULT_MEDIA_TYPE } from "../../constants";

/**
 * Automatically sets response constants as defined in the `HeadersModel` enum.
 */
@Injectable()
export class SetMediaType implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

        return next.handle().pipe(
            tap(() => {
                const res = context.switchToHttp().getResponse<Response>();
                res.setHeader('Content-Type', DEFAULT_MEDIA_TYPE);
            })
        );
    }
}