import { TaxiiHttpErrorStatus } from './helper';
import { TaxiiErrorException } from './interface/taxii-error.exception';

export class TaxiiInternalServerErrorException extends TaxiiErrorException {
  static readonly httpStatus: number = TaxiiHttpErrorStatus.INTERNAL_SERVER_ERROR; // do not change

  constructor(props: Partial<TaxiiErrorException>) {
    super(props, TaxiiInternalServerErrorException.httpStatus);
  }
}
