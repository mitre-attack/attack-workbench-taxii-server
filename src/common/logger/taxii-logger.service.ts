import {
  ConsoleLogger,
  Inject,
  Injectable,
  LoggerService,
  LogLevel,
  Optional,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { WinstonModule } from 'nest-winston';
import { TaxiiConfigService } from 'src/config';
import * as winston from 'winston';
import { isDefined } from 'class-validator';
import { REQUEST_ID_TOKEN } from '../middleware/set-request-id.middleware';

/**
 * Request-scoped logger service that correlates log messages with HTTP request IDs.
 * A new instance is created for each incoming request and garbage-collected after processing.
 */
@Injectable({ scope: Scope.REQUEST })
export class TaxiiLoggerService extends ConsoleLogger {
  // loggerPlus is used to send the output everywhere *except* for the console. We use the Nest Logger from
  // @nestjs/common for console logging because it is simple and straightforward. We use Winston to send output every-
  // where else (e.g. to file, HTTP, Slack, and Sentry) because Winston handles much of the logic for us.
  private readonly loggerPlus: LoggerService;

  constructor(
    private readonly appConfigService: TaxiiConfigService,
    @Optional() @Inject(REQUEST) private readonly request?: Request,
  ) {
    super();

    /**
     * We only initialize the winston logger (loggerPlus) if logToFile, logToSlack, or logToSentry is enabled.
     * We enforce this condition because Winston requires at least one transports method, and if they were all
     * disabled, then Winston would default to writing logs to the console. We don't want this to happen because we
     * are already using the ConsoleLogger instance that ships with @nestjs/common
     */
    const createNonConsoleLogger: boolean =
      !!this.appConfigService.LOG_TO_FILE ||
      !!this.appConfigService.LOG_TO_HTTP_HOST ||
      !!this.appConfigService.LOG_TO_SLACK_URL ||
      !!this.appConfigService.LOG_TO_SENTRY_DSN;

    if (createNonConsoleLogger) {
      /**
       * Applying a second ! operator (!!undefined) yields false, so in effect !!undefined converts undefined to
       * false. The values false, null, undefined, 0, -0, NaN, and '' (empty string) are "falsy" values. All other
       * values are "truthy."
       */
      this.loggerPlus = this.createLoggerPlus(
        this.appConfigService.LOG_LEVEL,
        !!this.appConfigService.LOG_TO_FILE,
        !!this.appConfigService.LOG_TO_HTTP_HOST,
        !!this.appConfigService.LOG_TO_SLACK_URL,
        !!this.appConfigService.LOG_TO_SENTRY_DSN,
      );
    }
  }

  /**
   * Gets the request ID from the injected request object, if available.
   */
  private getRequestId(): string | undefined {
    return this.request?.[REQUEST_ID_TOKEN];
  }

  private formatMessageToJSON(message: unknown): Record<string, unknown> {
    return {
      reqId: this.getRequestId(),
      message: message,
    };
  }

  private formatMessageToString(message: unknown): string {
    const reqId = this.getRequestId();
    const messageStr = String(message);
    return reqId ? `[${reqId}]  ${messageStr}` : messageStr;
  }

  log(message: unknown, context?: string) {
    // loggerPlus (winston) will handle log to file, HTTP, and webhook (Slack or Sentry)
    if (isDefined(this.loggerPlus)) {
      this.loggerPlus.log(this.formatMessageToJSON(message), context);
    }
    // super (ConsoleLogger) will handle logging to console
    if (isDefined(context)) {
      super.log(this.formatMessageToString(message), context);
    } else {
      super.log(this.formatMessageToString(message));
    }
  }

  warn(message: unknown, context?: string) {
    // loggerPlus (winston) will handle log to file, HTTP, and webhook (Slack or Sentry)
    if (isDefined(this.loggerPlus)) {
      this.loggerPlus.warn(this.formatMessageToJSON(message), context);
    }
    // super (ConsoleLogger) will handle logging to console
    if (isDefined(context)) {
      super.warn(this.formatMessageToString(message), context);
    } else {
      super.warn(this.formatMessageToString(message));
    }
  }

  debug(message: unknown, context?: string) {
    // loggerPlus (winston) will handle log to file, HTTP, and webhook (Slack or Sentry)
    if (isDefined(this.loggerPlus)) {
      this.loggerPlus.debug(this.formatMessageToJSON(message), context);
    }
    // super (ConsoleLogger) will handle logging to console
    if (isDefined(context)) {
      super.debug(this.formatMessageToString(message), context);
    } else {
      super.debug(this.formatMessageToString(message));
    }
  }

  error(message: unknown, _stack?: string, context?: string) {
    // loggerPlus (winston) will handle log to file, HTTP, and webhook (Slack or Sentry)
    if (isDefined(this.loggerPlus)) {
      this.loggerPlus.error(this.formatMessageToJSON(message), context);
    }
    // super (ConsoleLogger) will handle logging to console
    if (isDefined(context)) {
      super.error(this.formatMessageToString(message), context);
    } else {
      super.error(this.formatMessageToString(message));
    }
  }

  verbose(message: unknown, context?: string) {
    // loggerPlus (winston) will handle log to file, HTTP, and webhook (Slack or Sentry)
    if (isDefined(this.loggerPlus)) {
      this.loggerPlus.verbose(this.formatMessageToJSON(message), context);
    }
    // super (ConsoleLogger) will handle logging to console
    if (isDefined(context)) {
      super.verbose(this.formatMessageToString(message), context);
    } else {
      super.verbose(this.formatMessageToString(message));
    }
  }

  private createLoggerPlus(
    logLevel: LogLevel = this.appConfigService.LOG_LEVEL,
    file = false,
    http = false,
    slack = false,
    sentry = false,
  ): LoggerService {
    // Initialize Winston transports
    const transports = [];

    if (file) {
      // add file transport method
      const timestamp = new Date().toJSON().slice(0, 10); // timestamp on 2022-Feb-17 looks like '2022-02-17'
      transports.push(
        new winston.transports.File({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.json(),
          ),
          filename: `taxii_server_${timestamp}.log`, // looks like taxii_server_2022-02-17.log
          level: logLevel,
        }),
      );
    }

    if (http) {
      // add http transport method
      transports.push(
        new winston.transports.Http({
          host: this.appConfigService.LOG_TO_HTTP_HOST,
          port: this.appConfigService.LOG_TO_HTTP_PORT,
          path: this.appConfigService.LOG_TO_HTTP_PATH,
        }),
      );
    }

    if (slack) {
      // add slack transport method
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SlackHook = require('winston-slack-webhook-transport');
      transports.push(
        new SlackHook({
          webhookUrl: this.appConfigService.LOG_TO_SLACK_URL, // e.g., 'https://hooks.slack.com/services/xxx/xxx/xxx/'
        }),
      );
    }

    if (sentry) {
      // add sentry transport method
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('winston-transport-sentry-node').default;
      transports.push(
        new Sentry({
          sentry: {
            dsn: this.appConfigService.LOG_TO_SENTRY_DSN, // e.g., 'https://******@sentry.io/12345'
          },
          level: logLevel,
        }),
      );
    }

    // Create the logger instance
    return WinstonModule.createLogger({
      level: logLevel,
      transports: transports,
      exceptionHandlers: transports,
      exitOnError: false,
    });
  }
}
