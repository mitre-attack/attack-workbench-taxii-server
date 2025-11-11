import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { instanceToPlain } from "class-transformer";

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Handle undefined/null data
        if (!data) {
          console.log("SnakeCase - No data to process");
          return {};
        }

        try {
          // If data is already a plain object, transform it directly
          if (typeof data === "object" && !data.constructor?.name) {
            return this.transform(data);
          }

          // Use class-transformer's instanceToPlain
          const plainObject = instanceToPlain(data, {
            excludeExtraneousValues: true,
            exposeDefaultValues: true,
          });

          // Transform to snake case
          const result = this.transform(plainObject);

          return result;
        } catch (error) {
          console.error("SnakeCase - Error during transformation:", error);
          return data;
        }
      }),
    );
  }

  private transform(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transformToSnakeCase(item));
    }

    return this.transformToSnakeCase(data);
  }

  private transformToSnakeCase(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (data instanceof Date) {
      return data.toISOString();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transformToSnakeCase(item));
    }

    const snakeCaseData = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`,
        );
        snakeCaseData[snakeKey] = this.transformToSnakeCase(value);
      }
    }
    return snakeCaseData;
  }
}
