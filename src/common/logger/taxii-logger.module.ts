import { Global, Module } from '@nestjs/common';
import { TaxiiLoggerService } from './taxii-logger.service';
import { WinstonModule } from 'nest-winston';

@Global()
@Module({
  imports: [WinstonModule],
  providers: [TaxiiLoggerService],
  exports: [TaxiiLoggerService],
})
export class TaxiiLoggerModule {}
