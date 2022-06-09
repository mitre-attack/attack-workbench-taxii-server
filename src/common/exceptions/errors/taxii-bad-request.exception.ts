import {TaxiiHttpErrorStatus} from "./helper";
import {TaxiiErrorException} from "./interface/taxii-error.exception";

export class TaxiiBadRequestException extends TaxiiErrorException {

    static readonly httpStatus?: number = TaxiiHttpErrorStatus.BAD_REQUEST;  // do not change

    constructor(props: Partial<TaxiiErrorException>) {
        super(props, TaxiiBadRequestException.httpStatus);
    }

}