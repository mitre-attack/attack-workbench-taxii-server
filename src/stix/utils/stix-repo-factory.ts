import { StixModule } from "../stix.module";
import { STIX_REPO_TOKEN, WORKBENCH_OPTIONS } from "../constants";
import { WorkbenchRepository } from "../providers/workbench/workbench.repository";
import { DynamicModule } from "@nestjs/common";
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
    // switch (options.useType) {
    //     case STIX_REPO_TYPE.WORKBENCH: {
    //         return useWorkbenchRepository(options.workbench);
    //     }
    //
    //     case STIX_REPO_TYPE.TYPE_ORM: {
    //         return useOrmRepository();
    //     }
    //
    //     case STIX_REPO_TYPE.FILE_BASED: {
    //         return useFileBasedRepository();
    //     }
    //
    //     default:
    //         return useWorkbenchRepository(options.workbench);
    // }
  }
}

/**
 * Instantiates an instance of the StixModule with WorkbenchRepository as the provider
 * @param options  Configuration parameters. Users looking to modify or extend the functionality of WorkbenchRepository
 * can use the options parameter to influence the configuration of Workbench at runtime.
 */
const useWorkbenchRepository = (
  options: WorkbenchConnectOptionsInterface
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
    ],
    exports: [STIX_REPO_TOKEN, WorkbenchRepository],
  };
};

/**
 * Instantiates an instance of the StixModule with OrmRepository as the provider.
 * NOTE: OrmRepository is not implemented. This is primarily here for future release. See src/stix/README.md.
 */
// const useOrmRepository = (): DynamicModule => {
//     return {
//         module: StixModule,
//         providers: [
//             {
//                 provide: STIX_REPO_TOKEN,
//                 useClass: OrmRepository,
//             },
//         ],
//         exports: [STIX_REPO_TOKEN],
//     };
// };

/**
 * Instantiates an instance of the StixModule with FileRepository as the provider.
 * NOTE: FileRepository is not implemented. This is primarily here for future release. See src/stix/README.md.
 */
// const useFileBasedRepository = (): DynamicModule => {
//     return {
//         module: StixModule,
//         providers: [
//             {
//                 provide: STIX_REPO_TOKEN,
//                 useClass: FileRepository,
//             },
//         ],
//         exports: [STIX_REPO_TOKEN],
//     };
// };
