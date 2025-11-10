import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Converts the specified query parameter to an instance of Number.
 *
 * Non-integers (i.e., non whole numbers) are truncated and rounded down.
 */
export const NumberQuery = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const queryParam = request.query[data];

    if (!queryParam) return undefined;

    if (queryParam === "") {
      return undefined;
    }

    /**
     * 1 - strip any quotes, i.e. "200.123" -> '200.123'
     * 2 - convert to number, i.e., '200.123' -> 200.123
     * 3 - round number down, i.e., 200.123 -> 200
     */
    const parsedNumber = Math.floor(Number(queryParam.replace(/['"]+/g, "")));

    if (isNaN(parsedNumber)) {
      return undefined;
    }

    return parsedNumber;
  },
);
