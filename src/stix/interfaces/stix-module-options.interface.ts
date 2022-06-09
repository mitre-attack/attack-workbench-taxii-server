import {WorkbenchConnectOptionsInterface} from "../providers/workbench/interfaces/workbench-connect-options.interface";

export interface StixConnectOptions {
    /**
     * Any value from STIX_REPO (See: src/stix/request-context.middleware.ts)
     */
    useType: string;
    workbench?: WorkbenchConnectOptionsInterface;
}