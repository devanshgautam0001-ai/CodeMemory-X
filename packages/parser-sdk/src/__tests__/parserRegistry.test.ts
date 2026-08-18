import { describe, it, expect } from 'vitest';
import { ok } from '@codememory/shared';
import { ParserRegistry } from '../registry/ParserRegistry.js';
import { ILanguageParser } from '../ports/ILanguageParser.js';
import { LanguageId } from '../types/LanguageId.js';
import { ParserCapabilities } from '../types/ParserCapabilities.js';
import { ParseResult } from '../models/SymbolModels.js';

function createMockParser(lang: LanguageId, capabilitiesPartial?: Partial<ParserCapabilities>): ILanguageParser {
  const defaultCaps: ParserCapabilities = {
    supportsClasses: true,
    supportsInterfaces: true,
    supportsEnums: true,
    supportsNamespaces: true,
    supportsImports: true,
    supportsExports: true,
    supportsDecorators: false,
    supportsGenerics: true,
    supportsAnnotations: false,
    supportsMacros: false,
    ...capabilitiesPartial,
  };

  return {
    languageId: lang,
    capabilities: defaultCaps,
    parse: async (_source: string, filePath: string) => {
      const result: ParseResult = {
        languageId: lang,
        sourcePath: filePath,
        symbols: [],
        references: [],
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        enums: [],
        namespaces: [],
        parseDurationMs: 1.0,
      };
      return ok(result);
    },
  };
}

describe('ParserRegistry Unit Tests', () => {
  it('should register and retrieve language parsers', () => {
    const registry = new ParserRegistry();
    const tsParser = createMockParser('typescript');
    const pyParser = createMockParser('python');

    registry.register(tsParser);
    registry.register(pyParser);

    expect(registry.hasParser('typescript')).toBe(true);
    expect(registry.hasParser('PYTHON')).toBe(true); // Case-insensitive
    expect(registry.getParser('typescript')).toBe(tsParser);
    expect(registry.getRegisteredLanguages()).toEqual(['typescript', 'python']);
  });

  it('should unregister language parsers cleanly', () => {
    const registry = new ParserRegistry();
    const javaParser = createMockParser('java');

    registry.register(javaParser);
    expect(registry.hasParser('java')).toBe(true);

    const removed = registry.unregister('java');
    expect(removed).toBe(true);
    expect(registry.hasParser('java')).toBe(false);
  });
});
