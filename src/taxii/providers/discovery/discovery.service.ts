import { Injectable } from "@nestjs/common";
import { TaxiiConfigService } from "src/config";
import { DiscoverOptions, DiscoveryDto, ApiRootDto } from "./dto";
import { DEFAULT_CONTENT_TYPE } from "src/common/middleware/content-negotiation/supported-media-types";

@Injectable()
export class DiscoveryService {
  constructor(private readonly config: TaxiiConfigService) {}

  discover(): DiscoveryDto {
    const options: DiscoverOptions = {
      title: this.config.API_ROOT_TITLE,
      contact: this.config.CONTACT_EMAIL,
      description: this.config.API_ROOT_DESCRIPTION,
      default: this.config.API_ROOT_PATH,
      api_roots: [this.config.API_ROOT_PATH],
    };

    return new DiscoveryDto(options);
  }

  findApiRootInformation(): ApiRootDto {
    return new ApiRootDto({
      title: this.config.API_ROOT_TITLE,
      description: this.config.API_ROOT_DESCRIPTION,
      versions: [
        DEFAULT_CONTENT_TYPE, // ** A value of "application/taxii+json;version=2.1" MUST be included in this list to indicate conformance with this specification. ** //
      ],
      maxContentLength: this.config.MAX_CONTENT_LENGTH,
    });
  }
}
