import { ArgumentsHost, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DEFAULT_MEDIA_TYPE } from '../middleware/content-negotiation/constants';
import { RequestContext, RequestContextModel } from '../middleware/request-context';
import { TaxiiErrorException } from './errors/interface/taxii-error.exception';
import { TaxiiInternalServerErrorException } from './errors/taxii-internal-server-error.exception';

export class TaxiiExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger(TaxiiExceptionFilter.name);

  /**
   * Handles uncaught exceptions. Any exceptions which are caught that are not a subclass of TaxiiErrorException are
   * transformed to instances of TaxiiInternalServerErrorException and returned to the user.
   * @param exception The uncaught exception instance that triggered the filter
   * @param host Provides access to the HTTP context
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const reqCtx: RequestContext = RequestContextModel.get();
    const requestId = reqCtx?.['x-request-id'] || 'unknown';

    // Log the exception type and details
    this.logger.error(
      `[${requestId}] Exception occurred: ${exception?.constructor?.name || typeof exception}`,
    );

    if (typeof exception === 'string') {
      this.logger.error(`[${requestId}] String exception: ${exception}`);
    } else if (exception instanceof Error) {
      this.logger.error(`[${requestId}] Error details: ${exception.message}`);
      if (exception.stack) {
        this.logger.error(`[${requestId}] Stack trace: ${exception.stack}`);
      }
    } else {
      try {
        this.logger.error(`[${requestId}] Exception details: ${JSON.stringify(exception)}`);
      } catch (e) {
        this.logger.error(`[${requestId}] Could not stringify exception: ${e.message}`);
      }
    }

    // Handle TAXII exceptions
    if (exception instanceof TaxiiErrorException) {
      exception.errorId = requestId.toString();
      const body = JSON.stringify(exception);
      response.removeHeader('Content-Type');
      response.status(exception.httpStatus);
      response.setHeader('Content-Type', DEFAULT_MEDIA_TYPE.toString());
      response.setHeader('Content-Length', Buffer.byteLength(body));
      response.end(body);
      return;
    }

    // Handle NestJS HttpExceptions (like NotFoundException, BadRequestException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Format the response in TAXII error format
      const taxiiError = {
        title:
          typeof exceptionResponse === 'object' && 'error' in exceptionResponse
            ? exceptionResponse.error
            : exception.name,
        description:
          typeof exceptionResponse === 'object' && 'message' in exceptionResponse
            ? exceptionResponse.message
            : exception.message,
        error_id: requestId.toString(),
        http_status: status.toString(),
      };

      const body = JSON.stringify(taxiiError);
      response.removeHeader('Content-Type');
      response.status(status);
      response.setHeader('Content-Type', DEFAULT_MEDIA_TYPE.toString());
      response.setHeader('Content-Length', Buffer.byteLength(body));
      response.end(body);
      return;
    }

    // For all other exceptions (including strings, non-HTTP errors, etc.)
    const internalServerError = new TaxiiInternalServerErrorException({
      title: 'Internal Error',
      description:
        'An unexpected error has occurred. Please contact the TAXII server administrator.',
      errorId: requestId.toString(),
    });

    const body = JSON.stringify(internalServerError);
    response.removeHeader('Content-Type');
    response.status(TaxiiInternalServerErrorException.httpStatus);
    response.setHeader('Content-Type', DEFAULT_MEDIA_TYPE.toString());
    response.setHeader('Content-Length', Buffer.byteLength(body));
    response.end(body);
  }
}
