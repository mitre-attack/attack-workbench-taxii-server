import { Module } from "@nestjs/common";
import { DiscoveryService } from "./discovery.service";

@Module({
  imports: [],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
