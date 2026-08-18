import { LanguageId } from '@codememory/parser-sdk';
import { Result, ok, fail } from '@codememory/shared';
import { ILogger } from '@codememory/logging';

export interface LanguageGrammarConfig {
  languageId: LanguageId;
  grammarPath?: string;
  isLoaded: boolean;
}

export class LanguageLoader {
  private configs: Map<string, LanguageGrammarConfig> = new Map();

  constructor(private readonly logger?: ILogger) {
    this.registerSupportedLanguages();
  }

  private registerSupportedLanguages(): void {
    const supported: LanguageId[] = [
      'typescript',
      'javascript',
      'python',
      'java',
      'csharp',
      'go',
      'rust',
      'cpp',
      'php',
    ];

    supported.forEach((lang) => {
      this.configs.set(lang.toLowerCase(), {
        languageId: lang,
        isLoaded: lang === 'typescript' || lang === 'javascript',
      });
    });
  }

  public async loadLanguage(languageId: LanguageId): Promise<Result<LanguageGrammarConfig>> {
    const config = this.configs.get(languageId.toLowerCase());
    if (!config) {
      const err = new Error(`Unsupported Tree-sitter language: ${languageId}`);
      this.logger?.warn(err.message);
      return fail(err);
    }

    config.isLoaded = true;
    this.logger?.info(`Loaded Tree-sitter grammar configuration for: ${languageId}`);
    return ok(config);
  }

  public isLanguageSupported(languageId: LanguageId): boolean {
    return this.configs.has(languageId.toLowerCase());
  }

  public getSupportedLanguages(): LanguageId[] {
    return Array.from(this.configs.values()).map((c) => c.languageId);
  }
}
