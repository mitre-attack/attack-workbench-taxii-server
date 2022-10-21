import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from "@nestjs/common";
import { RequestContextMiddleware } from "./request-context.middleware";
import { RequestContextModel } from "./request-context.model";
import { REQUEST_CONTEXT_MODULE_OPTIONS } from "./constants";

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
    options: RequestContextModuleOptions<T>
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

  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
