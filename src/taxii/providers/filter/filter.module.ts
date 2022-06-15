import { Module } from "@nestjs/common";
import { FilterService } from "./filter.service";
// import {TimestampModule} from "../../../common/models/timestamp";

@Module({
  // imports: [TimestampModule],
  imports: [],
  exports: [FilterService],
  providers: [FilterService],
})
export class FilterModule {}
