import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiLoggerService } from 'src/common/logger/taxii-logger.service';
import { TaxiiConfigModule } from 'src/config';
import { WORKBENCH_OPTIONS } from 'src/stix/constants';
import { WorkbenchRepository } from './workbench.repository';

it('can create an instance of WorkbenchRepository', async () => {
  const module = await Test.createTestingModule({
    imports: [
      TaxiiConfigModule,
      TaxiiLoggerModule,
      HttpModule,
      CacheModule.register({
        isGlobal: true,
        ttl: 600,
      }),
    ],
    providers: [
      WorkbenchRepository,
      { provide: ConsoleLogger, useClass: TaxiiLoggerService },
      {
        provide: WORKBENCH_OPTIONS,
        useValue: { baseUrl: 'http://localhost:8000' },
      },
    ],
  }).compile();

  const workbenchRepo = await module.resolve(WorkbenchRepository);
  expect(workbenchRepo).toBeDefined();
});
