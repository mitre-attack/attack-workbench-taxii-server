import {TaxiiHttpErrorStatus} from "./helper";
import {TaxiiErrorException} from "./interface/taxii-error.exception";

export class TaxiiForbiddenException extends TaxiiErrorException {

    static readonly httpStatus?: number = TaxiiHttpErrorStatus.FORBIDDEN;  // do not change

    constructor(props: Partial<TaxiiErrorException>) {
        super(props, TaxiiForbiddenException.httpStatus);
    }

}