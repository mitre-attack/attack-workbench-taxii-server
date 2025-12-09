import { Module } from '@nestjs/common';
import { FilterService } from './filter.service';

@Module({
  imports: [],
  exports: [FilterService],
  providers: [FilterService],
})
export class FilterModule {}
