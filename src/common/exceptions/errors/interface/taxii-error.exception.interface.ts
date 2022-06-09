import {DEFAULT_EXT_DETAILS} from "../helper";
import {HttpException} from "@nestjs/common";

export interface TaxiiErrorExceptionInterface {

    /**
     * @name title
     * @required true
     * @type string
     * @descr A human readable plain text title for this error.
     */
    title: string;


    /**
     * @name description
     * @required false
     * @type string
     * @descr A human readable plain text description that gives details about the error or problem that was encountered by the application.
     */
    description?: string;


    /**
     * @name error_id
     * @required false
     * @type string
     * An identifier for this particular error instance. A TAXII Server might choose to assign each error occurrence its own identifier in order to facilitate debugging.
     */
    errorId?: string;
    // NOT IMPLEMENTED


    /**
     * @name error_code
     * @required false
     * @type string
     * @descr The error code for this error type. A TAXII Server might choose to assign a common error code to all errors of the same type. Error codes are application-specific and not intended to be meaningful across different TAXII Servers.
     */
    errorCode?: string;
    // NOT IMPLEMENTED


    /**
     * @name http_status
     * @required false
     * @type string
     * The HTTP status code applicable to this error. If this property is provided it MUST match the HTTP status code found in the HTTP header.
     */
    httpStatus?: number;


    /**
     * external_details (optional)
     * string
     * A URL that points to additional details. For example, this could be a URL pointing to a knowledge base article describing the error code. Absence of this property indicates that there are no additional details.
     */
    externalDetails?: string;

    /**
     * details (optional)
     * dictionary
     * The details property captures additional server-specific details about the error. The keys and values are determined by the TAXII Server and MAY be any valid JSON object structure.
     */
    details?: Error | Object;

}