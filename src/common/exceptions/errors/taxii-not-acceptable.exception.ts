import { TaxiiHttpErrorStatus } from './helper';
import { TaxiiErrorException } from './interface/taxii-error.exception';

export class TaxiiNotAcceptableException extends TaxiiErrorException {
  static readonly httpStatus?: number = TaxiiHttpErrorStatus.NOT_ACCEPTABLE; // do not change

  constructor(props: Partial<TaxiiErrorException>) {
    super(props, TaxiiNotAcceptableException.httpStatus);
  }
}
