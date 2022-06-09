import { Controller, Get, Param } from '@nestjs/common';
import {TaxiiServiceUnavailableException} from "src/common/exceptions";
import {TaxiiLoggerService as Logger} from "src/common/logger/taxii-logger.service";
import {DiscoveryService} from "src/taxii/providers";
import {ApiRootDto, DiscoveryDto} from "src/taxii/providers/discovery/dto";

@Controller()
export class RootController {

    constructor(
        private readonly discoveryService: DiscoveryService,
        private readonly logger: Logger
    )
    {
        logger.setContext(RootController.name);
    }

    @Get("/taxii2/")
    serverDiscovery() : DiscoveryDto {
        this.logger.debug(`Received a discovery request`, this.constructor.name);
        return this.discoveryService.discover();
    }

    @Get(`/`)
    getApiRootInformation() : ApiRootDto {
        this.logger.debug(`Received a request for API root information`, this.constructor.name);
        return this.discoveryService.findApiRootInformation();
    }

    @Get(`/:statusId/`)
    getStatus(
        @Param('statusId') statusId: string
    ) : Promise<any>
    {
        this.logger.warn(`${this.getStatus.name} is not implemented`, this.constructor.name);
        throw new TaxiiServiceUnavailableException({
            title: "Not Implemented",
            description: "The 'Get Status' endpoint is not implemented."
        });
    }
}
