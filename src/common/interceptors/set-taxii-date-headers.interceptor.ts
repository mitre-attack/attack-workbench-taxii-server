import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StixObjectPropertiesInterface } from 'src/stix/interfaces/stix-object-properties.interface';
import { ManifestRecordDto } from 'src/taxii/providers/manifest/dto';

export enum TaxiiDateFrom {
  ENVELOPE = 'envelope',
  MANIFEST = 'manifest',
  VERSIONS = 'versions',
}

export interface SetTaxiiDateHeadersOptions {
  useType: TaxiiDateFrom;
}

/**
 * Finds the minimum and maximum values in an array without using spread operator,
 * which can fail with large arrays due to call stack limitations.
 */
function findMinMax(values: number[]): { min: number; max: number } {
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }
  return { min, max };
}

/**
 * Formats a Date as an RFC 3339 timestamp with microsecond precision.
 * TAXII requires format: YYYY-MM-DDTHH:MM:SS.ssssssZ
 */
function toTaxiiTimestamp(date: Date): string {
  // toISOString() gives millisecond precision (3 digits): 2025-01-15T12:00:00.123Z
  // TAXII requires microsecond precision (6 digits): 2025-01-15T12:00:00.123000Z
  const isoString = date.toISOString();
  // Replace .xxxZ with .xxx000Z to add microsecond precision
  return isoString.replace(/\.(\d{3})Z$/, '.$1000Z');
}

/**
 * Automatically sets Response headers: 'X-TAXII-Date-Added-First' and 'X-TAXII-Date-Added-Last'
 */
@Injectable()
export class SetTaxiiDateHeadersInterceptor implements NestInterceptor {
  private readonly type: string;
  private readonly logger: Logger = new Logger(SetTaxiiDateHeadersInterceptor.name);

  constructor(options: SetTaxiiDateHeadersOptions) {
    this.type = options.useType;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (!data) return data; // Early return if no data

        const res = context.switchToHttp().getResponse<Response>();
        let addedFirst: Date | undefined;
        let addedLast: Date | undefined;

        switch (this.type) {
          case TaxiiDateFrom.ENVELOPE: {
            if (data.objects?.length >= 1) {
              const stixObjects: StixObjectPropertiesInterface[] = data.objects;
              // Find actual min/max created dates across all objects
              const dates = stixObjects.map((obj) => new Date(obj.created).getTime());
              const { min, max } = findMinMax(dates);
              addedFirst = new Date(min);
              addedLast = new Date(max);
            }
            break;
          }
          case TaxiiDateFrom.MANIFEST: {
            if (data.objects?.length >= 1) {
              const manifestRecords: ManifestRecordDto[] = data.objects;
              // Find actual min/max dateAdded across all manifest records
              const dates = manifestRecords.map((rec) => new Date(rec.dateAdded).getTime());
              const { min, max } = findMinMax(dates);
              addedFirst = new Date(min);
              addedLast = new Date(max);
            }
            break;
          }
          case TaxiiDateFrom.VERSIONS: {
            if (data.versions?.length >= 1) {
              const versions: string[] = data.versions;
              // Find actual min/max version timestamps
              const dates = versions.map((v) => new Date(v).getTime());
              const { min, max } = findMinMax(dates);
              addedFirst = new Date(min);
              addedLast = new Date(max);
            }
            break;
          }
        }

        if (addedFirst && addedLast) {
          const firstTimestamp = toTaxiiTimestamp(addedFirst);
          const lastTimestamp = toTaxiiTimestamp(addedLast);
          res.setHeader('X-TAXII-Date-Added-First', firstTimestamp);
          res.setHeader('X-TAXII-Date-Added-Last', lastTimestamp);
          this.logger.debug(
            `Set TAXII date headers: first=${firstTimestamp}, last=${lastTimestamp}`,
            this.constructor.name,
          );
        }

        // Always return the data
        return data;
      }),
    );
  }
}
