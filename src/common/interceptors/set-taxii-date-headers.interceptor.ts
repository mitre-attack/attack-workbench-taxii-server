import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "express";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
import { ManifestRecordDto } from "src/taxii/providers/manifest/dto";

export enum TaxiiDateFrom {
  ENVELOPE = "envelope",
  MANIFEST = "manifest",
  VERSIONS = "versions",
}

export interface SetTaxiiDateHeadersOptions {
  useType: TaxiiDateFrom;
}

/**
 * Automatically sets Response headers: 'X-TAXII-Date-Added-First' and 'X-TAXII-Date-Added-Last'
 */
@Injectable()
export class SetTaxiiDateHeadersInterceptor implements NestInterceptor {
  private readonly type: string;
  private readonly logger: Logger = new Logger(
    SetTaxiiDateHeadersInterceptor.name,
  );

  constructor(options: SetTaxiiDateHeadersOptions) {
    this.type = options.useType;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (!data) return data; // Early return if no data

        const res = context.switchToHttp().getResponse<Response>();
        let addedFirst;
        let addedLast;

        switch (this.type) {
          case TaxiiDateFrom.ENVELOPE: {
            if (data.objects?.length >= 1) {
              const stixObjects: StixObjectPropertiesInterface[] = data.objects;
              addedFirst = stixObjects[0].created;
              addedLast = stixObjects[stixObjects.length - 1].created;
            }
            break;
          }
          case TaxiiDateFrom.MANIFEST: {
            if (data.objects?.length >= 1) {
              const manifestRecords: ManifestRecordDto[] = data.objects;
              addedFirst = manifestRecords[0].dateAdded;
              addedLast = manifestRecords[manifestRecords.length - 1].dateAdded;
            }
            break;
          }
          case TaxiiDateFrom.VERSIONS: {
            if (data.versions?.length >= 1) {
              const versions: string[] = data.versions;
              addedFirst = versions[0];
              addedLast = versions[versions.length - 1];
            }
            break;
          }
        }

        if (addedFirst && addedLast) {
          res.setHeader("X-TAXII-Date-Added-First", addedFirst);
          res.setHeader("X-TAXII-Date-Added-Last", addedLast);
          this.logger.debug(
            `Set TAXII date headers: first=${addedFirst}, last=${addedLast}`,
            this.constructor.name,
          );
        }

        // Always return the data
        return data;
      }),
    );
  }
}
