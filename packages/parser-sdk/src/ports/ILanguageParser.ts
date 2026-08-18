import { Result } from '@codememory/shared';
import { LanguageId } from '../types/LanguageId.js';
import { ParserCapabilities } from '../types/ParserCapabilities.js';
import { ParseResult } from '../models/SymbolModels.js';

export interface ILanguageParser {
  readonly languageId: LanguageId;
  readonly capabilities: ParserCapabilities;

  parse(sourceCode: string, filePath: string): Promise<Result<ParseResult>>;
}
