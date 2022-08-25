import { DynamicModule, Global, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { CollectorModule } from "./collector/collector.module";
import { CollectorConnectOptions } from "./collector/interfaces/collector-connect.options";
import { HydrateService } from "./hydrate.service";
import { StixModule } from "../stix/stix.module";
import { TaxiiCacheModule } from "../cache/taxii-cache.module";

@Global()
@Module({})
export class HydrateModule {
  static register(options: CollectorConnectOptions): DynamicModule {
    return {
      module: HydrateModule,
      imports: [
        TaxiiCacheModule.forRoot(options.cacheConnectOptions),

        ScheduleModule.forRoot(),

        MongooseModule.forRoot(options.databaseConnectOptions.mongoUri),

        StixModule.register(options.stixConnectOptions),

        CollectorModule,
      ],
      providers: [HydrateService],
    };
  }
}
