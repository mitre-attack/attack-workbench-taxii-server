import {TaxiiHttpErrorStatus} from "./helper";
import {TaxiiErrorException} from "./interface/taxii-error.exception";

export class TaxiiNotFoundException extends TaxiiErrorException {

    static readonly httpStatus?: number = TaxiiHttpErrorStatus.NOT_FOUND;  // do not change

    constructor(props: Partial<TaxiiErrorException>) {
        super(props, TaxiiNotFoundException.httpStatus);
    }

}