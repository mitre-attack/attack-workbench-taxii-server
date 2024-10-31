import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                console.log('SnakeCase - Input data:', data);
                console.log('SnakeCase - Input type:', data?.constructor?.name);
                console.log('SnakeCase - Input properties:', Object.keys(data || {}));
                
                // Handle undefined/null data
                if (data === undefined || data === null) {
                    console.log('SnakeCase - Received null/undefined data');
                    return {};
                }

                try {
                    // Use class-transformer's instanceToPlain
                    const plainObject = instanceToPlain(data, {
                        excludeExtraneousValues: true,
                        exposeDefaultValues: false
                    });
                    console.log('SnakeCase - After instanceToPlain:', plainObject);

                    // Transform to snake case
                    const result = this.transform(plainObject);
                    console.log('SnakeCase - Final result:', result);
                    
                    return result;
                } catch (error) {
                    console.error('SnakeCase - Error during transformation:', error);
                    // Return the original data if transformation fails
                    return data;
                }
            })
        );
    }

    private transform(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.transformToSnakeCase(item));
        }
        
        return this.transformToSnakeCase(data);
    }

    private transformToSnakeCase(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        if (data instanceof Date) {
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