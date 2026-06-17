import { Injectable } from '@nestjs/common';
import { TaxiiConfigService } from 'src/config';
import { DiscoveryDto, ApiRootDto } from './dto';
import { DEFAULT_CONTENT_TYPE } from 'src/common/middleware/content-negotiation/supported-media-types';
import { ReleaseService } from '../release/release.service';
import { versionToReleaseSegment } from '../release/constants';

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly config: TaxiiConfigService,
    private readonly releaseService: ReleaseService,
  ) {}

  /**
   * Lists every available API root: the latest-tracking default root (e.g. api/v21) plus one
   * pinned root per hydrated ATT&CK release (e.g. api/v21/attack-19.1), oldest first. The pinned
   * roots are derived from database state, so newly hydrated releases appear with no operator
   * involvement.
   */
  async discover(): Promise<DiscoveryDto> {
    const defaultRoot = this.config.API_ROOT_PATH;
    const releases = await this.releaseService.listReleases();

    return new DiscoveryDto({
      title: this.config.API_ROOT_TITLE,
      contact: this.config.CONTACT_EMAIL,
      description: this.config.API_ROOT_DESCRIPTION,
      default: defaultRoot,
      apiRoots: [
        defaultRoot,
        ...releases.map((release) => `${defaultRoot}/${versionToReleaseSegment(release.version)}`),
      ],
    });
  }

  /**
   * Returns API Root Information.
   * @param release When specified, describes the pinned API root for that ATT&CK release;
   *                otherwise describes the latest-tracking default root.
   */
  findApiRootInformation(release?: string): ApiRootDto {
    return new ApiRootDto({
      title: release
        ? `${this.config.API_ROOT_TITLE} (ATT&CK v${release})`
        : this.config.API_ROOT_TITLE,
      description: release
        ? `${this.config.API_ROOT_DESCRIPTION} This API Root is pinned to ATT&CK release ${release}.`
        : this.config.API_ROOT_DESCRIPTION,
      versions: [
        DEFAULT_CONTENT_TYPE, // ** A value of "application/taxii+json;version=2.1" MUST be included in this list to indicate conformance with this specification. ** //
      ],
      maxContentLength: this.config.MAX_CONTENT_LENGTH,
    });
  }
}
