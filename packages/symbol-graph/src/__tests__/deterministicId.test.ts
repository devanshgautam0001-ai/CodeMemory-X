import { describe, it, expect } from 'vitest';
import { generateDeterministicSymbolId } from '../utils/deterministicId.js';

describe('Deterministic Symbol ID Generator', () => {
  it('should produce identical IDs for identical inputs across multiple runs', () => {
    const input = {
      language: 'typescript',
      filePath: 'src/services/AuthService.ts',
      symbolType: 'class',
      symbolName: 'AuthService',
      location: { filePath: 'src/services/AuthService.ts', startLine: 10, endLine: 50, startColumn: 1, endColumn: 20 },
    };

    const id1 = generateDeterministicSymbolId(input);
    const id2 = generateDeterministicSymbolId(input);
    const id3 = generateDeterministicSymbolId(input);

    expect(id1).toBe(id2);
    expect(id2).toBe(id3);
    expect(id1.startsWith('sym_')).toBe(true);
  });

  it('should produce different IDs for different symbols or line numbers', () => {
    const input1 = {
      language: 'typescript',
      filePath: 'src/services/AuthService.ts',
      symbolType: 'function',
      symbolName: 'validateToken',
      location: { filePath: 'src/services/AuthService.ts', startLine: 15, endLine: 25, startColumn: 3, endColumn: 20 },
    };

    const input2 = {
      language: 'typescript',
      filePath: 'src/services/AuthService.ts',
      symbolType: 'function',
      symbolName: 'validateToken',
      location: { filePath: 'src/services/AuthService.ts', startLine: 30, endLine: 40, startColumn: 3, endColumn: 20 },
    };

    expect(generateDeterministicSymbolId(input1)).not.toBe(generateDeterministicSymbolId(input2));
  });
});
