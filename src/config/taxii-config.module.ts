import { Global, Module } from "@nestjs/common";
import { configuration, validationSchema } from "./configuration";
import { TaxiiConfigService } from "./taxii-config.service";
import { ConfigModule, ConfigService } from "@nestjs/config";

/**
 * Import and provide app configuration related classes.
 *
 * @module
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      // envFilePath: `config/${process.env.TAXII_ENV}.env`,
      envFilePath: `config/.env`,
      validationSchema: validationSchema,
    }),
  ],
  providers: [ConfigService, TaxiiConfigService],
  exports: [TaxiiConfigService],
})
export class TaxiiConfigModule {}
