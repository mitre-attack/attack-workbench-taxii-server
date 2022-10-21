import { Module } from "@nestjs/common";
import { ObjectModule } from "../object";
import { PaginationModule } from "../pagination";
import { EnvelopeService } from "./envelope.service";

@Module({
  imports: [PaginationModule, ObjectModule],
  exports: [EnvelopeService],
  providers: [EnvelopeService],
})
export class EnvelopeModule {}
