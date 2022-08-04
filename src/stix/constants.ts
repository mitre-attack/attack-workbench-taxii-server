export enum STIX_REPO_TYPE {
  WORKBENCH = "workbench",
  TYPE_ORM = "orm",
  FILE_BASED = "file",
}

/**
 * STIX_REPO_TOKEN is a reference/pointer to the injectable subclass that extends StixRepositoryAbstract.
 * It is used by any TaxiiModule providers which consume StixModule's provided service (e.g., WorkbenchRepository,
 * OrmRepository). These include any repository/DAO classes in TaxiiModule (e.g., CollectionRepository).
 */
export const STIX_REPO_TOKEN = "STIX_REPO_TOKEN";

/**
 * WORKBENCH_OPTIONS is used to inject options (WorkbenchConnectOptionsInterface) from the configuration during
 * application bootstrap initialization. See 'Dynamic Providers' Nest.JS documentation for details.
 */
export const WORKBENCH_OPTIONS = "WORKBENCH_OPTIONS";
