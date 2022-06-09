import {TaxiiHttpErrorStatus} from "./helper";
import {TaxiiErrorException} from "./interface/taxii-error.exception";

export class TaxiiUnathorizedException extends TaxiiErrorException {

    static readonly httpStatus?: number = TaxiiHttpErrorStatus.UNAUTHORIZED;  // do not change

    constructor(props: Partial<TaxiiErrorException>) {
        super(props, TaxiiUnathorizedException.httpStatus);
    }

}