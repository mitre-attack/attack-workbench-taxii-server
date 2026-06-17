import { MitreAttackConnectOptionsInterface } from './mitre-attack-connect-options.interface';
import { WorkbenchConnectOptionsInterface } from './workbench-connect-options.interface';

/**
 * Determines which STIX repository/DAO implementation the StixModule instantiates. The value is
 * matriculated from the `TAXII_STIX_DATA_SRC` environment variable.
 */
export type StixDataSource = 'workbench' | 'mitre-attack';

export interface StixConnectOptions {
  useType?: StixDataSource;
  workbench?: WorkbenchConnectOptionsInterface;
  mitreAttack?: MitreAttackConnectOptionsInterface;
}
