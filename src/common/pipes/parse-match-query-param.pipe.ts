// parse-match-query-param.pipe.ts

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { MatchDto } from '../models/match/match.dto';

export interface ParseMatchQueryParamPipeOptions {
  /**
   * If 'latest', defaults version filter to 'last' when not provided.
   * If 'all', leaves version filter undefined (returns all versions).
   */
  defaultVersionBehavior: 'all' | 'latest';
}

@Injectable()
export class ParseMatchQueryParamPipe implements PipeTransform {
  private static readonly MATCH_KEY_REGEX = /^match\[(\w+)\]$/;
  private static readonly VALID_FIELDS = new Set(['id', 'type', 'version', 'spec_version']);
  private static readonly VERSION_KEYWORDS = new Set(['all', 'first', 'last']);

  private readonly options: ParseMatchQueryParamPipeOptions;

  constructor(options: ParseMatchQueryParamPipeOptions = { defaultVersionBehavior: 'all' }) {
    this.options = options;
  }

  transform(query: Record<string, string | string[]>): MatchDto | undefined {
    if (!query || typeof query !== 'object') {
      return this.buildDefaultMatch();
    }

    const matchData: Partial<Record<string, string[]>> = {};

    for (const key of Object.keys(query)) {
      const regexMatch = ParseMatchQueryParamPipe.MATCH_KEY_REGEX.exec(key);
      if (!regexMatch) continue;

      const field = regexMatch[1];

      if (!ParseMatchQueryParamPipe.VALID_FIELDS.has(field)) {
        throw new BadRequestException(`Invalid match field: "${field}"`);
      }

      const rawValue = query[key];

      if (Array.isArray(rawValue)) {
        throw new BadRequestException(
          `match[${field}] appears multiple times. Per TAXII 2.1, each field MUST NOT occur more than once.`,
        );
      }

      matchData[field] = this.parseValues(field, rawValue);
    }

    // Apply default version behavior if version not specified
    if (!matchData.version && this.options.defaultVersionBehavior === 'latest') {
      matchData.version = ['last'];
    }

    return Object.keys(matchData).length > 0 ? new MatchDto(matchData) : this.buildDefaultMatch();
  }

  private buildDefaultMatch(): MatchDto | undefined {
    if (this.options.defaultVersionBehavior === 'latest') {
      return new MatchDto({ version: ['last'] });
    }
    return undefined;
  }

  private parseValues(field: string, rawValue: string): string[] {
    const values = rawValue
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    if (field === 'version') {
      this.validateVersionValues(values);
    }

    return values;
  }

  private validateVersionValues(values: string[]): void {
    const hasAll = values.includes('all');

    if (hasAll && values.length > 1) {
      throw new BadRequestException(
        'The "all" version keyword MUST NOT be used with any other version parameter',
      );
    }

    const stixTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

    for (const value of values) {
      if (ParseMatchQueryParamPipe.VERSION_KEYWORDS.has(value)) continue;

      if (!stixTimestampRegex.test(value) || isNaN(new Date(value).getTime())) {
        throw new BadRequestException(
          `Invalid version value: "${value}". Must be "all", "first", "last", or a valid STIX timestamp`,
        );
      }
    }
  }
}
