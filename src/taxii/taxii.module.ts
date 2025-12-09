import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// ** middleware ** //
import { SetRequestIdMiddleware } from 'src/common/middleware/set-request-id.middleware';
import { ContentNegotiationMiddleware } from 'src/common/middleware/content-negotiation';
import { ResLoggerMiddleware } from 'src/common/middleware/res-logger.middleware';
import { SetResponseMediaType } from 'src/common/interceptors/set-response-media-type.interceptor';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { TaxiiExceptionFilter } from 'src/common/exceptions/taxii-exception.filter';

//** controllers **//
import { CollectionsController } from 'src/taxii/controllers/collections/collections.controller';
import { RootController } from 'src/taxii/controllers/root/root.controller';

// ** providers ** //
import {
  DiscoveryModule,
  CollectionModule,
  VersionModule,
  EnvelopeModule,
  ManifestModule,
  ObjectModule,
} from './providers';

@Module({
  imports: [
    DiscoveryModule,
    CollectionModule,
    ObjectModule,
    ManifestModule,
    VersionModule,
    EnvelopeModule,
  ],
  controllers: [CollectionsController, RootController],
  /**
   * This provider configuration ensures that:
   *  1. The TaxiiExceptionFilter handles all exceptions and sets proper Content-Type
   *  2. The TAXII headers are set (using @UseInterceptors on relevant controller methods)
   *  3. The response is properly serialized by the ClassSerializerInterceptor
   *  4. Then transformed to snake case
   *  5. Finally, has the media type set while preserving the response data
   *
   * NOTE: // Order matters! Serialize first, then transform
   */
  providers: [
    { provide: APP_FILTER, useClass: TaxiiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SnakeCaseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SetResponseMediaType },
  ],
})
export class TaxiiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SetRequestIdMiddleware).forRoutes('*'); // Generate a unique ID for each request
    consumer.apply(ContentNegotiationMiddleware).forRoutes('*'); // Inspect Accept header on all requests
    consumer.apply(ResLoggerMiddleware).forRoutes('*'); // Log each request
  }
}
