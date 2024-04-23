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
        // removes the square brackets using a regular expression and 
        // then splits the values by commas to create a MatchDto instance for 
        // each field.
        const field = key.replace(/[\[\]]/g, '');
        const values = value[key].split(',');
        const matchDto = new MatchDto({ [field]: values });
        matchDtos.push(matchDto);
      }
    }
    
    return matchDtos;
  }
}