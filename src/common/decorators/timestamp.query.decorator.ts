import {createParamDecorator, ExecutionContext} from "@nestjs/common";
// import {DateTime} from "luxon";
import {TaxiiBadRequestException} from "../exceptions";

/**
 * Verifies that the specified query parameter is a valid date.
 */
export const TimestampQuery = createParamDecorator(

    (data: string, ctx: ExecutionContext) => {

        const request = ctx.switchToHttp().getRequest();

        const queryParam = request.query[data];
        if (!queryParam) return undefined;

        if (!isNaN( Date.parse(queryParam) )) {
            // date object is not valid
            throw new TaxiiBadRequestException({
                description: `'${queryParam}' is not a valid date.`
            });
        }

        // if (!DateTime.fromISO(queryParam).isValid) {
        //     throw new TaxiiBadRequestException({
        //         description: `'${queryParam}' is not a valid date.`
        //     });
        // }

        return queryParam;
    })