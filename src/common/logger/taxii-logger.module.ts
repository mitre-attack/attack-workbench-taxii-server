import { Global, Module } from "@nestjs/common";
import { TaxiiLoggerService } from "./taxii-logger.service";
import { WinstonModule } from "nest-winston";
import { TaxiiConfigModule } from "src/config";

@Global()
@Module({
  providers: [
    TaxiiLoggerService,
    {
      provide: "CONFIG",
      useValue: TaxiiConfigModule,
    },
  ],
  exports: [TaxiiLoggerService],
  imports: [WinstonModule],
  //    WinstonModule.forRoot({
  // transports: [
  //   new winston.transports.Console({
  //     format: winston.format.combine(
  //         winston.format.timestamp(),
  //         winston.format.ms(),
  //         nestWinstonModuleUtilities.format.nestLike('MyApp', { prettyPrint: true }),
  //     ),
  //   }),
  //   // other transports...
  // ],
  // other options
  //  }),
  //],
})
export class TaxiiLoggerModule {}
