import { describe, it, expect } from 'vitest';
import { ParserRegistry } from '../registry/ParserRegistry.js';
import { ILanguageParser } from '../ports/ILanguageParser.js';
import { ok } from '@codememory/shared';

describe('Parser Capability Resolution', () => {
  it('should accurately resolve feature capabilities for Rust parser contract', () => {
    const registry = new ParserRegistry();
    const mockRustParser: ILanguageParser = {
      languageId: 'rust',
      capabilities: {
        supportsClasses: false,
        supportsInterfaces: false, // uses traits
        supportsEnums: true,
        supportsNamespaces: true, // modules
        supportsImports: true,
        supportsExports: true,
        supportsDecorators: false,
        supportsGenerics: true,
        supportsAnnotations: true, // attributes #[derive]
        supportsMacros: true, // macro_rules!
      },
      parse: async (_src, path) => ok({
        languageId: 'rust',
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
        parseDurationMs: 0.8,
      }),
    };

    registry.register(mockRustParser);
    const parser = registry.getParser('rust');

    expect(parser).toBeDefined();
    if (parser) {
      expect(parser.capabilities.supportsMacros).toBe(true);
      expect(parser.capabilities.supportsAnnotations).toBe(true);
      expect(parser.capabilities.supportsClasses).toBe(false);
    }
  });
});
