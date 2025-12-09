import { DynamicModule, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CollectionsController } from 'src/taxii/controllers/collections/collections.controller';
import { RootController } from 'src/taxii/controllers/root/root.controller';
import { REQUEST_CONTEXT_MODULE_OPTIONS } from './constants';
import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextModel } from './request-context.model';

export interface RequestContextModuleOptions<T extends RequestContextModel> {
  contextClass: new () => T;
  isGlobal?: boolean; // If true, registers `RequestContextModule` as a global module.
}

@Module({
  providers: [RequestContextMiddleware],
  exports: [RequestContextMiddleware],
})
export class RequestContextModule implements NestModule {
  static forRoot<T extends RequestContextModel>(
    options: RequestContextModuleOptions<T>,
  ): DynamicModule {
    return {
      global: options.isGlobal,
      module: RequestContextModule,
      providers: [
        {
          provide: REQUEST_CONTEXT_MODULE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes(CollectionsController, RootController);
  }
}
