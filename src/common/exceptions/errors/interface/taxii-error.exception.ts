import { HttpException } from '@nestjs/common';
import { TaxiiErrorExceptionInterface } from './taxii-error.exception.interface';
import { DEFAULT_EXT_DETAILS, TaxiiHttpErrorStatus } from '../helper';

export class TaxiiErrorException extends HttpException implements TaxiiErrorExceptionInterface {
  errorId?: string; // errorId is set by the exception filter
  readonly httpStatus: number; // httpStatus is set by each subclass's identically named static variable, i.e., httpStatus
  readonly title: string; // title is the only required field
  readonly description?: string;
  readonly details?: Error | Record<string, unknown>;
  readonly errorCode?: string; // This implementation does not currently use the errorCode field, but it can be set if desired.
  readonly externalDetails?: string = DEFAULT_EXT_DETAILS; // Defaults to the public URL of the TAXII 2.1 specification document

  constructor(properties: Partial<TaxiiErrorException>, httpStatus: TaxiiHttpErrorStatus) {
    super(properties, httpStatus);
    this.httpStatus = httpStatus;
    Object.assign(this, properties);
  }

  /**
   * DO NOT CHANGE THIS FUNCTION. It modifies the shape of the response body. In essence, when Nest.js goes to return
   * an exception object to the user on the response body, it calls toJSON to determine the shape of that body. This
   * goes for all subclasses as well, e.g. TaxiiBadRequestException, TaxiiNotFoundException, etc.
   */
  toJSON() {
    return {
      title: this.title,
      description: this.description,
      http_status: this.httpStatus.toString(),
      error_code: this.errorCode,
      error_id: this.errorId,
      external_details: this.externalDetails,
      details: this.details,
    };
  }
}
