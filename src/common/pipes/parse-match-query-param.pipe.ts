import { PipeTransform, Injectable, ArgumentMetadata } from "@nestjs/common";
import { MatchDto } from "../models/match/match.dto";

/**
 * Converts the specified query parameter to an instance of MatchDto
 */
@Injectable()
export class ParseMatchQueryParamPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) return undefined;
    return new MatchDto(value);
  }
}
