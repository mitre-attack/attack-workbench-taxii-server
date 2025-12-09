import { TaxiiHttpErrorStatus } from './helper';
import { TaxiiErrorException } from './interface/taxii-error.exception';

export class TaxiiServiceNotImplementedException extends TaxiiErrorException {
  static readonly httpStatus?: number = TaxiiHttpErrorStatus.NOT_IMPLEMENTED; // do not change

  constructor(props: Partial<TaxiiErrorException>) {
    super(props, TaxiiServiceNotImplementedException.httpStatus);
  }
}
