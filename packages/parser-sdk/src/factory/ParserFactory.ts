import { Result, ok, fail } from '@codememory/shared';
import { LanguageId } from '../types/LanguageId.js';
import { ILanguageParser } from '../ports/ILanguageParser.js';
import { ParserRegistry } from '../registry/ParserRegistry.js';
import { ILogger } from '@codememory/logging';

export class ParserFactory {
  constructor(
    private readonly defaultRegistry: ParserRegistry,
    private readonly logger?: ILogger
  ) {}

  public createParser(
    languageId: LanguageId,
    overrideRegistry?: ParserRegistry
  ): Result<ILanguageParser> {
    const registry = overrideRegistry || this.defaultRegistry;
    const parser = registry.getParser(languageId);

    if (!parser) {
      const err = new Error(`No parser registered for language: ${languageId}`);
      this.logger?.warn(`ParserFactory lookup failed: ${err.message}`);
      return fail(err);
    }

    this.logger?.info(`ParserFactory resolved parser for: ${languageId}`);
    return ok(parser);
  }
}
