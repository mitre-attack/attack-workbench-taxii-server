import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MatchDto } from 'src/common/models/match/match.dto';

/**
 * Converts the specified query parameter to an instance of MatchDto
 */
export const MatchQuery = createParamDecorator((data: string, ctx: ExecutionContext): MatchDto => {
  const request = ctx.switchToHttp().getRequest();
  if (request.query[data]) {
    return new MatchDto(request.query[data]);
  }
  return undefined;
});
