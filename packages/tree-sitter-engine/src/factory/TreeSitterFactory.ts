import { LanguageId, ParserFactory } from '@codememory/parser-sdk';
import { Result, ok, fail } from '@codememory/shared';
import { TreeSitterParser } from '../parser/TreeSitterParser.js';
import { TreeSitterRegistry } from '../registry/TreeSitterRegistry.js';
import { LanguageLoader } from '../loader/LanguageLoader.js';

export class TreeSitterFactory {
  private registry: TreeSitterRegistry;
  private loader: LanguageLoader;
  private sdkFactory: ParserFactory;

  constructor() {
    this.registry = new TreeSitterRegistry();
    this.loader = new LanguageLoader();
    this.sdkFactory = new ParserFactory(this.registry);
    this.initializeDefaultParsers();
  }

  private initializeDefaultParsers(): void {
    // Initial support for TypeScript and JavaScript
    this.registry.register(new TreeSitterParser('typescript'));
    this.registry.register(new TreeSitterParser('javascript'));
  }

  public async getParser(languageId: LanguageId): Promise<Result<TreeSitterParser>> {
    if (!this.loader.isLanguageSupported(languageId)) {
      return fail(new Error(`Language ${languageId} is not supported by Tree-sitter engine`));
    }

    if (!this.registry.hasParser(languageId)) {
      // Lazily instantiate parser for extended languages (python, java, go, rust, etc.)
      const newParser = new TreeSitterParser(languageId);
      this.registry.register(newParser);
    }

    const res = this.sdkFactory.createParser(languageId, this.registry);
    if (res.isFailure) return fail(res.error);

    return ok(res.value as TreeSitterParser);
  }

  public getSupportedLanguages(): LanguageId[] {
    return this.loader.getSupportedLanguages();
  }
}
