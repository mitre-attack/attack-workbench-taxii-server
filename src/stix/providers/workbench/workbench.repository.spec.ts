import { CacheModule } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { WorkbenchRepository } from './workbench.repository';
import { HttpModule } from '@nestjs/axios';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { ConsoleLogger } from '@nestjs/common';
import { TaxiiLoggerService } from 'src/common/logger/taxii-logger.service';
import { WORKBENCH_OPTIONS } from 'src/stix/constants';

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

  const workbenchRepo = module.get(WorkbenchRepository);
  expect(workbenchRepo).toBeDefined();
});
