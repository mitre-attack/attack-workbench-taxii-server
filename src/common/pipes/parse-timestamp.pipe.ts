import { PipeTransform, Injectable, ArgumentMetadata } from "@nestjs/common";
import { TaxiiBadRequestException } from "../exceptions";

@Injectable()
export class ParseTimestampPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) return undefined;

    const dateValue = Date.parse(value);

    if (isNaN(dateValue)) {
      // date object is not valid
      throw new TaxiiBadRequestException({
        description: `'${value}' is not a valid date.`,
      });
    }

    return value;
  }
}
