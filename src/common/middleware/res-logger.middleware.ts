import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { REQUEST_ID_TOKEN } from './set-request-id.middleware';

@Injectable()
export class ResLoggerMiddleware implements NestMiddleware {
  private logger = new Logger(ResLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const reqId = req[REQUEST_ID_TOKEN] || 'unknown';
    const { ip, method, originalUrl } = req;
    const userAgent = req.headers['user-agent'] || '';

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');

      this.logger.log(
        `Outgoing response: [${reqId}] ${statusCode} ${method} ${originalUrl} ${contentLength} - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
