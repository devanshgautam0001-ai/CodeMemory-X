import { LanguageId } from '../types/LanguageId.js';
import { ILanguageParser } from '../ports/ILanguageParser.js';
import { ILogger } from '@codememory/logging';

export class ParserRegistry {
  private parsers: Map<string, ILanguageParser> = new Map();

  constructor(private readonly logger?: ILogger) {}

  public register(parser: ILanguageParser): void {
    const key = parser.languageId.toLowerCase();
    this.parsers.set(key, parser);
    this.logger?.info(`Registered language parser for: ${parser.languageId}`);
  }

  public unregister(languageId: LanguageId): boolean {
    const key = languageId.toLowerCase();
    const removed = this.parsers.delete(key);
    if (removed) {
      this.logger?.info(`Unregistered language parser for: ${languageId}`);
    }
    return removed;
  }

  public getParser(languageId: LanguageId): ILanguageParser | undefined {
    return this.parsers.get(languageId.toLowerCase());
  }

  public hasParser(languageId: LanguageId): boolean {
    return this.parsers.has(languageId.toLowerCase());
  }

  public getRegisteredLanguages(): LanguageId[] {
    return Array.from(this.parsers.values()).map((p) => p.languageId);
  }

  public clear(): void {
    this.parsers.clear();
  }
}
