import {ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {APP_INTERCEPTOR} from "@nestjs/core";

// ** middleware ** //
import {SetRequestIdMiddleware} from "src/common/middleware/set-request-id.middleware";
import {ValidateRequestHeadersMiddleware} from "src/common/middleware/validate-request-headers.middleware";
import {ResLoggerMiddleware} from "src/common/middleware/res-logger.middleware";
import {SetMediaType} from "src/common/interceptors/set-media-type.interceptor";

//** controllers **//
import {CollectionsController} from "src/taxii/controllers/collections/collections.controller";
import {RootController} from "src/taxii/controllers/root/root.controller";

// ** providers ** //
import {TaxiiLoggerModule} from "src/common/logger/taxii-logger.module";
import {
    DiscoveryModule,
    CollectionModule,
    VersionModule,
    EnvelopeModule,
    ManifestModule,
    ObjectModule } from "./providers";


@Module({
    imports: [
        DiscoveryModule,
        CollectionModule,
        ObjectModule,
        ManifestModule,
        VersionModule,
        EnvelopeModule,
        TaxiiLoggerModule,
    ],
    controllers: [CollectionsController, RootController],
    providers: [
        { provide: APP_INTERCEPTOR, useClass: SetMediaType },
        { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    ]
})
export class TaxiiModule implements NestModule{
    configure(consumer: MiddlewareConsumer): any {
        consumer.apply(SetRequestIdMiddleware).forRoutes('*');  // Generate a unique ID for each request
        consumer.apply(ValidateRequestHeadersMiddleware).forRoutes('*');  // Inspect Accept header on all requests
        consumer.apply(ResLoggerMiddleware).forRoutes('*');  // Log each request
    }
}
