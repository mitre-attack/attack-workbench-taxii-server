import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TaxiiSerializerInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                console.log('Serializer - Input:', data);
                
                if (!data) {
                    return {};
                }

                // First transform to plain object
                const plainObject = instanceToPlain(data, {
                    excludeExtraneousValues: true,
                    exposeDefaultValues: false
                });
                console.log('Serializer - After instanceToPlain:', plainObject);

                // Then convert to snake case
                const snakeCaseObject = this.toSnakeCase(plainObject);
                console.log('Serializer - After snake case:', snakeCaseObject);

                // Remove undefined/null properties
                const cleanObject = this.removeEmptyProperties(snakeCaseObject);
                console.log('Serializer - Final result:', cleanObject);

                return cleanObject;
            })
        );
    }

    private toSnakeCase(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.toSnakeCase(item));
        }

        const result = {};
        for (const [key, value] of Object.entries(data)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = this.toSnakeCase(value);
        }
        return result;
    }

    private removeEmptyProperties(obj: any): any {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.removeEmptyProperties(item));
        }

        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value) && value.length === 0) {
                    continue;
                }
                result[key] = this.removeEmptyProperties(value);
            }
        }
        return result;
    }
}