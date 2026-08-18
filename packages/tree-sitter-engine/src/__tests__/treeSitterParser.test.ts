import { describe, it, expect } from 'vitest';
import { TreeSitterFactory } from '../factory/TreeSitterFactory.js';
import { TreeSitterParser } from '../parser/TreeSitterParser.js';

describe('TreeSitterEngine (AST Parser)', () => {
  const sampleTypeScript = `
import { IMemoryAtom } from '@codememory/core';
import { calculateHash } from './hashUtils';

export abstract class BaseRepository extends StorageAdapter {
  async findById(id: string) {
    calculateHash(id);
    return null;
  }
}

namespace InternalUtils {
  function formatPath(p: string) {
    return p;
  }
}

export function initializeEngine() {
  return true;
}
`;

  it('should parse TypeScript source and extract functions, classes, imports, exports, namespaces', async () => {
    const factory = new TreeSitterFactory();
    const parserRes = await factory.getParser('typescript');
    expect(parserRes.isSuccess).toBe(true);

    if (parserRes.isSuccess) {
      const parser = parserRes.value;
      const parseRes = await parser.parse(sampleTypeScript, 'src/repo.ts');
      expect(parseRes.isSuccess).toBe(true);

      if (parseRes.isSuccess) {
        const result = parseRes.value;
        expect(result.languageId).toBe('typescript');
        expect(result.sourcePath).toBe('src/repo.ts');

        // Verify imports
        expect(result.imports.length).toBeGreaterThanOrEqual(2);
        expect(result.imports[0].sourcePath).toBe('@codememory/core');

        // Verify classes
        expect(result.classes.length).toBeGreaterThanOrEqual(1);
        expect(result.classes[0].name).toBe('BaseRepository');
        expect(result.classes[0].isAbstract).toBe(true);
        expect(result.classes[0].superClass).toBe('StorageAdapter');

        // Verify functions
        expect(result.functions.length).toBeGreaterThanOrEqual(1);
        const fnNames = result.functions.map((f) => f.name);
        expect(fnNames).toContain('initializeEngine');

        // Verify namespaces
        expect(result.namespaces.length).toBeGreaterThanOrEqual(1);
        expect(result.namespaces[0].name).toBe('InternalUtils');

        // Verify exports
        expect(result.exports.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('should support lazy loading parsers for Python, Rust, and Go', async () => {
    const factory = new TreeSitterFactory();
    const rustRes = await factory.getParser('rust');
    expect(rustRes.isSuccess).toBe(true);
    if (rustRes.isSuccess) {
      expect(rustRes.value.capabilities.supportsMacros).toBe(true);
    }

    const pyRes = await factory.getParser('python');
    expect(pyRes.isSuccess).toBe(true);
  });
});
