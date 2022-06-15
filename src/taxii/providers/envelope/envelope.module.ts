import { Module } from "@nestjs/common";
import { ObjectModule } from "../object/object.module";
import { PaginationModule } from "../pagination/pagination.module";
import { EnvelopeService } from "./envelope.service";

@Module({
  imports: [PaginationModule, ObjectModule],
  exports: [EnvelopeService],
  providers: [EnvelopeService],
})
export class EnvelopeModule {}
