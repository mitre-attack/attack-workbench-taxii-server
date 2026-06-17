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
         * within StixModule is instantiated as one of several types (e.g., WorkbenchRepository,
         * MitreAttackRepository). The type selection is determined by the StixConnectOptions parameter
         * (specifically its useType property, sourced from the TAXII_STIX_DATA_SRC environment variable),
         * which itself is defined by the configuration service (AppConfigService).
         *
         * NOTE: WorkbenchRepository (hydrates from a running ATT&CK Workbench instance) and
         * MitreAttackRepository (hydrates from the official ATT&CK releases on GitHub) are supported at
         * this time.
         **/
        StixModule.register(connectOptions.stixConnectOptions),
      ],
    };
  }
}
