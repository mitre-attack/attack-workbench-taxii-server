import {Module} from "@nestjs/common"
import {ObjectModule} from "../object/object.module";
import {EnvelopeService} from "../envelope/envelope.service";
import {ManifestService} from "../manifest";
import {PaginationService} from "./pagination.service";
import {ManifestModule} from "../manifest/manifest.module";
import {VersionService} from "../version/version.service";

@Module({
    imports: [],
    providers: [PaginationService],
    exports: [PaginationService]
})
export class PaginationModule {}
