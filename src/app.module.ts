import { DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxiiLoggerModule } from './common/logger/taxii-logger.module';
import { TaxiiConfigModule } from './config';
import { AppConnectOptions } from './interfaces';
import { StixModule } from './stix/stix.module';
import { TaxiiModule } from './taxii/taxii.module';

@Global()
@Module({})
export class AppModule {
  static register(connectOptions: AppConnectOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
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
