import { PipeTransform, Injectable, ArgumentMetadata } from "@nestjs/common";
import { MatchDto } from "../models/match/match.dto";

/**
 * Converts the specified query parameter to an instance of MatchDto
 */
@Injectable()
export class ParseMatchQueryParamPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) return undefined;

    const matchDtos: MatchDto[] = [];

    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        const values = value[key].split(",");
        const matchDto = new MatchDto({ [key]: values });
        matchDtos.push(matchDto);
      }
    }

    return matchDtos;
  }
}