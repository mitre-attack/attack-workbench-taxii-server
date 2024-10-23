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
    SetTaxiiDateHeadersInterceptor.name
  );

  constructor(options: SetTaxiiDateHeadersOptions) {
    this.type = options.useType;
  }

  // `data` in this case is the response body.
  //
  // We only want to work on responses containing `envelope` resources and responses containing `manifest`
  // resources. In both cases, the response body will be a LinkedNode.
  //
  // And in both cases, the LinkedNode's `elem` property will contain an array. The Array will either be of
  // type ManifestDto (i.e. Array<ManifestDto>) or StixObjectPropertiesInterface (i.e. Array<StixObjectPropertiesInterface>)
  //
  // We want to grab the first elem of the list and extract its 'created' property (referring to the creation
  // date/timestamp of that object).
  //
  // We also want to grab the last elem of the list, and similarly extract its 'created' property.
  //
  // Finally we will set response headers 'X-TAXII-Date-Added-First' and 'X-TAXII-Date-Added-Last' accordingly
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // data.elem will exist if the response body includes an an object which implements SinglePageInterface
        // (i.e., an EnvelopeDto instance or a ManifestDto instance)
        // The objects property will be either an envelope (Array<StixObjectPropertiesDto>) or a
        // manifest (Array<ManifestRecordDto>)
        if (data.objects) {
          // ok cool - so we're about to send either an envelope or manifest to the user, which case we need
          // to set the headers which indicates the date_added timestamp of the first object and the last
          // object of the response.

          // get the response context
          const res = context.switchToHttp().getResponse<Response>();

          let addedFirst;
          let addedLast;
          switch (this.type) {
            case TaxiiDateFrom.ENVELOPE: {
              // get the array of objects from the response body
              const stixObjects: StixObjectPropertiesInterface[] = data.objects;
              if (stixObjects.length >= 1) {
                addedFirst = stixObjects[0].created;
                addedLast = stixObjects[stixObjects.length - 1].created;
              } else {
                this.logger.debug(
                  `Not setting headers 'x-taxii-date-added-first' or 'x-taxii-date-added-last' because returned envelope resource does not contain any objects`,
                  this.constructor.name
                );
              }
              break;
            }
            case TaxiiDateFrom.MANIFEST: {
              const manifestRecords: ManifestRecordDto[] = data.objects;
              if (manifestRecords.length >= 1) {
                addedFirst = manifestRecords[0].dateAdded;
                addedLast =
                  manifestRecords[manifestRecords.length - 1].dateAdded;
              } else {
                this.logger.debug(
                  `Not setting headers 'x-taxii-date-added-first' or 'x-taxii-date-added-last' because returned manifest resource does not contain any objects`,
                  this.constructor.name
                );
              }
              break;
            }
            case TaxiiDateFrom.VERSIONS: {
              // TODO confirm this works then delete TODO: complete this block after version endpoint is implemented
              const versions: string[] = data.objects;
              if (versions.length >= 1) {
                addedFirst = versions[0];
                addedLast = versions[versions.length - 1];
              } else {
                this.logger.debug(
                  `Not setting headers 'x-taxii-date-added-first' or 'x-taxii-date-added-last' because returned versions resource does not contain any strings`
                );
              }
              break;
            }
          }

          if (addedFirst && addedLast) {
            res.setHeader("X-TAXII-Date-Added-First", addedFirst);
            this.logger.debug(
              `Set response header 'x-taxii-date-added-first: ${addedFirst}`,
              this.constructor.name
            );
            res.setHeader("X-TAXII-Date-Added-Last", addedLast);
            this.logger.debug(
              `Set response header 'x-taxii-date-added-last: ${addedLast}`,
              this.constructor.name
            );
            // and we're done! let's return the response body now...
          }

          // don't modify the data (i.e. the response body); we're only here to add those pesky TAXII headers!
          return data;
          // end if
        }
        // end map
      })
    );
  }
}
