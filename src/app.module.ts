import { DynamicModule, Global, Module } from '@nestjs/common';
import { TaxiiConfigModule } from './config';
import { RequestContext, RequestContextModule } from './common/middleware/request-context';
import { TaxiiModule } from './taxii/taxii.module';
import { StixModule } from './stix/stix.module';
import { AppConnectOptions } from './interfaces';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxiiLoggerModule } from './common/logger/taxii-logger.module';

@Global()
@Module({})
export class AppModule {
  static register(connectOptions: AppConnectOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        /**
         * IMPORTANT: RequestContextModule must be loaded before the TaxiiModule!
         * The RequestContextModule effectively grants TaxiiModule providers a hook into every request object.
         * This is where request IDs are stored, and thus how the Taxii providers/providers are able to
         * log messages with corollary HTTP request information. The primary objective of this module is to make
         * error tracing easier by automatically mapping end-user request information to corresponding log
         * messages.
         **/
        RequestContextModule.forRoot({
          contextClass: RequestContext,
          isGlobal: true,
        }),

        MongooseModule.forRoot(connectOptions.databaseConnectOptions.mongoUri),

        /** This is where all user-configurable parameters are defined **/
        TaxiiConfigModule,

        TaxiiLoggerModule,

        /** This is where all TAXII providers and HTTP controllers are hosted. **/
        TaxiiModule,

        /**
         * The .register() call initializes the STIX module. The respective STIX repository/DAO contained
         * within StixModule is instantiated as one of three types: WorkbenchRepository, OrmRepository, or
         * FileRepository. The type selection is determined by the StixConnectOptions parameter, which itself
         * is defined by the configuration service (AppConfigService).
         *
         * NOTE: FileRepository and OrmRepository is not yet implemented. Only WorkbenchRepository is
         * supported at this time.
         **/
        StixModule.register(connectOptions.stixConnectOptions),
      ],
    };
  }
}
