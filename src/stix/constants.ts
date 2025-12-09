/**
 * STIX_REPO_TOKEN is a reference/pointer to the injectable subclass that extends StixRepositoryAbstract.
 * It is used by any TaxiiModule providers which consume StixModule's provided service (e.g., WorkbenchRepository,
 * OrmRepository). These include any repository/DAO classes in TaxiiModule (e.g., CollectionRepository).
 */
export const STIX_REPO_TOKEN = 'STIX_REPO_TOKEN';

/**
 * WORKBENCH_OPTIONS is used to inject options (WorkbenchConnectOptionsInterface) from the configuration during
 * application bootstrap initialization. See 'Dynamic Providers' Nest.JS documentation for details.
 */
export const WORKBENCH_OPTIONS = 'WORKBENCH_OPTIONS';

export enum StixIdentityPrefix {
  ATTACK_PATTERN = 'attack-pattern',
  TACTIC = 'x-mitre-tactic',
  MALWARE = 'malware',
  TOOL = 'tool',
  GROUP = 'intrusion-set',
  MITIGATION = 'course-of-action',
  MATRIX = 'x-mitre-matrix',
  IDENTITY = 'identity',
  MARKING_DEF = 'marking-definition',
  RELATIONSHIP = 'relationship',
  NOTE = 'note',
}

export enum WorkbenchRESTEndpoint {
  ATTACK_PATTERN = '/api/techniques/',
  TACTIC = '/api/tactics/',
  MALWARE = '/api/software/',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  TOOL = '/api/software/',
  GROUP = '/api/groups/',
  MITIGATION = '/api/mitigations/',
  MATRIX = '/api/matrices/',
  IDENTITY = '/api/identities/',
  MARKING_DEF = '/api/marking-definition/',
  RELATIONSHIP = '/api/relationships/',
  NOTE = '/api/notes/',
}
