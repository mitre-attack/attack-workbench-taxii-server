import { DynamicModule, Global, Module } from "@nestjs/common";
import { StixConnectOptions } from "./interfaces";
import { StixRepoFactory } from "./utils/stix-repo-factory";

@Global()
@Module({})
export class StixModule {
  static register(options: StixConnectOptions): DynamicModule {
    return StixRepoFactory.register(options);
  }
}
