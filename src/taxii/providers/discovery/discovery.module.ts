import { Module } from "@nestjs/common";
import { DiscoveryService } from "./discovery.service";

@Module({
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
