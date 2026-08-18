import { describe, it, expect } from 'vitest';
import { ParserRegistry } from '../registry/ParserRegistry.js';
import { ParserFactory } from '../factory/ParserFactory.js';
import { ILanguageParser } from '../ports/ILanguageParser.js';
import { ok } from '@codememory/shared';

describe('ParserFactory Unit Tests', () => {
  it('should create and resolve parsers registered in registry', () => {
    const registry = new ParserRegistry();
    const mockGoParser: ILanguageParser = {
      languageId: 'go',
      capabilities: {
        supportsClasses: false,
        supportsInterfaces: true,
        supportsEnums: false,
        supportsNamespaces: false,
        supportsImports: true,
        supportsExports: true,
        supportsDecorators: false,
        supportsGenerics: true,
        supportsAnnotations: false,
        supportsMacros: false,
      },
      parse: async (_src, path) => ok({
        languageId: 'go',
        sourcePath: path,
        symbols: [],
        references: [],
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        enums: [],
        namespaces: [],
        parseDurationMs: 0.5,
      }),
    };

    registry.register(mockGoParser);
    const factory = new ParserFactory(registry);

    const res = factory.createParser('go');
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.languageId).toBe('go');
      expect(res.value.capabilities.supportsClasses).toBe(false);
    }
  });

  it('should return failure when language parser is not registered', () => {
    const registry = new ParserRegistry();
    const factory = new ParserFactory(registry);

    const res = factory.createParser('ruby');
    expect(res.isFailure).toBe(true);
  });
});
