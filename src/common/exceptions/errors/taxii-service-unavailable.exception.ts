import {TaxiiHttpErrorStatus} from "./helper";
import {TaxiiErrorException} from "./interface/taxii-error.exception";

export class TaxiiServiceUnavailableException extends TaxiiErrorException {

    static readonly httpStatus?: number = TaxiiHttpErrorStatus.SERVICE_UNAVAILABLE;  // do not change

    constructor(props: Partial<TaxiiErrorException>) {
        super(props, TaxiiServiceUnavailableException.httpStatus);
    }

}