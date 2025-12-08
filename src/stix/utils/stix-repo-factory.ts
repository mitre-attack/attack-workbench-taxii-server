import { StixModule } from "../stix.module";
import { STIX_REPO_TOKEN, WORKBENCH_OPTIONS } from "../constants";
import { WorkbenchRepository } from "../providers/workbench/workbench.repository";
import { ConsoleLogger, DynamicModule } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { StixConnectOptions } from "../interfaces";
import { WorkbenchConnectOptionsInterface } from "../interfaces/workbench-connect-options.interface";

/**
 * The StixRepoFactory is responsible for instantiating the StixModule. `options.useType` is matriculated from main.ts
 * at runtime (which conversely determines the value of options.useType from an environment variable,
 * `TAXII_STIX_DATA_SRC`). The StixRepoFactory is not wholly necessary; it's just a central location to store StixModule
 * factory logic to keep the StixModule class itself clean and readable.
 */
export class StixRepoFactory {
  static register(options: StixConnectOptions): DynamicModule {
    return useWorkbenchRepository(options.workbench);
  }
}

/**
 * Instantiates an instance of the StixModule with WorkbenchRepository as the provider
 * @param options  Configuration parameters. Users looking to modify or extend the functionality of WorkbenchRepository
 * can use the options parameter to influence the configuration of Workbench at runtime.
 */
const useWorkbenchRepository = (
  options: WorkbenchConnectOptionsInterface,
): DynamicModule => {
  return {
    module: StixModule,
    imports: [
      HttpModule.register({
        headers: { Authorization: `Basic ${options.authorization}` },
      }),
    ],
    providers: [
      { provide: WORKBENCH_OPTIONS, useValue: options },
      { provide: STIX_REPO_TOKEN, useClass: WorkbenchRepository },
      WorkbenchRepository,
      ConsoleLogger,
    ],
    exports: [STIX_REPO_TOKEN, WorkbenchRepository],
  };
};
