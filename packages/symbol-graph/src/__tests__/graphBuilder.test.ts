import { describe, it, expect } from 'vitest';
import { SymbolGraphBuilder } from '../builder/SymbolGraphBuilder.js';
import { ParseResult } from '@codememory/parser-sdk';

describe('SymbolGraphBuilder', () => {
  const mockParseResult: ParseResult = {
    languageId: 'typescript',
    sourcePath: 'src/services/AuthService.ts',
    symbols: [],
    references: [
      {
        symbolId: 'ref_1',
        targetSymbolId: 'validateToken',
        location: { filePath: 'src/services/AuthService.ts', startLine: 12, endLine: 12, startColumn: 5, endColumn: 20 },
        kind: 'call',
      },
    ],
    imports: [
      {
        sourcePath: '@codememory/core',
        importedSymbols: ['ValueObject'],
        isDefault: false,
        location: { filePath: 'src/services/AuthService.ts', startLine: 1, endLine: 1, startColumn: 1, endColumn: 45 },
      },
    ],
    exports: [],
    functions: [
      {
        id: 'fn_validate',
        name: 'validateToken',
        kind: 'function',
        location: { filePath: 'src/services/AuthService.ts', startLine: 10, endLine: 20, startColumn: 1, endColumn: 2 },
        parameters: [{ name: 'token', type: 'string' }],
        isAsync: true,
        isStatic: false,
      },
    ],
    classes: [
      {
        id: 'cls_auth',
        name: 'AuthService',
        kind: 'class',
        location: { filePath: 'src/services/AuthService.ts', startLine: 5, endLine: 50, startColumn: 1, endColumn: 2 },
        superClass: 'BaseService',
        interfaces: [],
        methods: [],
        fields: [],
        isAbstract: false,
      },
    ],
    interfaces: [],
    enums: [],
    namespaces: [],
    parseDurationMs: 1.5,
  };

  it('should transform ParseResult into nodes and edges cleanly', () => {
    const builder = new SymbolGraphBuilder();
    const result = builder.buildFromParseResult(mockParseResult);

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      const graph = result.value;
      const nodes = graph.getAllNodes();
      const edges = graph.getAllEdges();

      expect(nodes.length).toBeGreaterThanOrEqual(3); // class, function, import
      expect(edges.length).toBeGreaterThanOrEqual(2); // EXTENDS, IMPORTS, CALLS
    }
  });
});
