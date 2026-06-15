import { Injectable, PipeTransform } from '@nestjs/common';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { releaseSegmentToVersion } from './constants';
import { ReleaseService } from './release.service';

/**
 * Validates the pinned-API-root path segment (e.g. "attack-19.1") and translates it to the ATT&CK
 * release version it denotes (e.g. "19.1").
 *
 * - Requests on the default API root carry no segment; undefined passes through (the service layer
 *   resolves the latest release per collection).
 * - A segment that is malformed or does not correspond to a hydrated release yields a 404, per the
 *   TAXII 2.1 requirement for unknown API roots.
 */
@Injectable()
export class ReleaseParamPipe implements PipeTransform<
  string | undefined,
  Promise<string | undefined>
> {
  constructor(private readonly releaseService: ReleaseService) {}

  async transform(value: string | undefined): Promise<string | undefined> {
    if (value === undefined) {
      return undefined;
    }

    const version = releaseSegmentToVersion(value);
    if (version && (await this.releaseService.releaseExists(version))) {
      return version;
    }

    throw new TaxiiNotFoundException({
      title: 'API Root Not Found',
      description: `The API Root path segment '${value}' does not correspond to an ATT&CK release available on this server. Request the discovery endpoint (GET /taxii2/) for the list of available API Roots.`,
    });
  }
}
