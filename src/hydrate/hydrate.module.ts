import { DynamicModule, Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { HydrateConnectOptions } from './interfaces/hydrate-connect.options';
import { HydrateService } from './hydrate.service';
import { StixModule } from '../stix/stix.module';
import {
  AttackObjectEntity,
  AttackObjectSchema,
  ReleasePointerEntity,
  ReleasePointerSchema,
  TaxiiCollectionEntity,
  TaxiiCollectionSchema,
} from './schema';
import { HYDRATE_OPTIONS_TOKEN } from './constants';

@Global()
@Module({})
export class HydrateModule {
  static register(options: HydrateConnectOptions): DynamicModule {
    return {
      module: HydrateModule,
      imports: [
        ScheduleModule.forRoot(),
        MongooseModule.forRoot(options.databaseConnectOptions.mongoUri),
        MongooseModule.forFeature([
          { name: AttackObjectEntity.name, schema: AttackObjectSchema },
          { name: TaxiiCollectionEntity.name, schema: TaxiiCollectionSchema },
          { name: ReleasePointerEntity.name, schema: ReleasePointerSchema },
        ]),
        StixModule.register(options.stixConnectOptions),
      ],
      providers: [
        {
          provide: HYDRATE_OPTIONS_TOKEN,
          useValue: options,
        },
        HydrateService,
      ],
      exports: [HydrateService],
    };
  }
}
