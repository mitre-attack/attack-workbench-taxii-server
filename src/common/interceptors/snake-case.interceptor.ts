import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => this.transform(data))
        );
    }

    private transform(data: any): any {
        if (Array.isArray(data)) {
            return data.map(item => this.transformToSnakeCase(item));
        }
        return this.transformToSnakeCase(data);
    }

    private transformToSnakeCase(data: any): any {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        if (data instanceof Date) {
            // Return the date as an ISO string without further transformation
            return data.toISOString();
        }

        if (Array.isArray(data)) {
            return data.map(item => this.transformToSnakeCase(item));
        }

        const snakeCaseData = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                snakeCaseData[snakeKey] = this.transformToSnakeCase(value);
            }
        }
        return snakeCaseData;
    }
}