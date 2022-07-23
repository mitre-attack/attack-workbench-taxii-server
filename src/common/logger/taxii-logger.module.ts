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
})
export class TaxiiLoggerModule {}
