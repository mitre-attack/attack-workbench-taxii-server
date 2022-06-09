import {
    ArgumentsHost,
    ExceptionFilter,
    HttpException,
    Logger
} from "@nestjs/common";
import {Response} from 'express';
import {TaxiiInternalServerErrorException} from "./errors/taxii-internal-server-error.exception";
import {TaxiiErrorException} from "./errors/interface/taxii-error.exception";
import {RequestContext, RequestContextModel } from "../middleware/request-context";

// @Catch(MyException) => can set to only catch specific exception types!
export class TaxiiExceptionFilter implements ExceptionFilter {

    private readonly logger: Logger = new Logger();


    /**
     * Handles uncaught exceptions. Any exceptions which are caught that are not a subclass of TaxiiErrorException are
     * transformed to instances of TaxiiInternalServerErrorException and returned to the user.
     * @param exception The uncaught exception instance that triggered the TaxiiExceptionFilter
     * @param host Provides access to the HTTP context so that the Request and Response objects can be worked upon
     */
    catch(exception: HttpException, host: ArgumentsHost): any {

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const reqCtx: RequestContext = RequestContextModel.get();

        this.logger.error(`[${reqCtx['x-request-id']}] The exception type is: ${exception.constructor.name}. The exception is ${JSON.stringify(exception)}`);

        // Send a generic 500 error for any uncaught exceptions
        if (!(exception instanceof TaxiiErrorException)) {

            this.logger.error(`[${reqCtx['x-request-id']}] Received an unhandled exception. Please investigate the root cause of the exception triggered by request: ${reqCtx['x-request-id']}`);
            this.logger.error(`[${reqCtx['x-request-id']}] The error is ${exception.stack.toString()}`)
            const internalServerError: TaxiiInternalServerErrorException = new TaxiiInternalServerErrorException({
                title: 'Internal Error',
                description: "An unexpected error has occurred. Please contact the TAXII server administrator.",
                // errorId: request['x-request-id'].toString(),
                errorId: reqCtx['x-request-id'].toString(),
            });

            // Send the error
            response
                .status(TaxiiInternalServerErrorException.httpStatus)
                .json(internalServerError);
        }

        // The else clause is triggered only if the exception type if one of the custom Taxii exception classes, in
        // which case all we want to do is set the errorId field then return the exception.
        else {

            // Copy the request's unique ID onto the outgoing response body
            exception.errorId = reqCtx['x-request-id'].toString();

            // Send the error
            response
                //.set('id', request['id'])
                .status(exception.httpStatus)
                .json(exception);
        }
    }
}