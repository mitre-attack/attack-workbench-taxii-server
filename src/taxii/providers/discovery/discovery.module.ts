import { Module } from '@nestjs/common';
import { ReleaseModule } from '../release';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [ReleaseModule],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
