import { describe, it, expect } from 'vitest';
import { ArchitecturalBaselineBuilder } from '../baseline/ArchitecturalBaselineBuilder.js';
import { SymbolGraph } from '@codememory/symbol-graph';

describe('ArchitecturalBaselineBuilder (Deterministic Baseline)', () => {
  const builder = new ArchitecturalBaselineBuilder();

  it('constructs a valid architectural baseline with hashing', () => {
    const graph = new SymbolGraph(
      [
        { id: 'sym1', name: 'MemoryEngine', kind: 'class', filePath: 'packages/memory-engine/src/MemoryEngine.ts', range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } } },
      ],
      []
    );

    const baseline = builder.build({ symbolGraph: graph, memories: [] });
    expect(baseline).toBeDefined();
    expect(baseline.hash).toContain('base_hash_');
    expect(baseline.packageDependencies.length).toBeGreaterThan(0);
  });

  it('generates identical baseline hash for identical inputs', () => {
    const graph = new SymbolGraph(
      [
        { id: 'sym1', name: 'ContextEngine', kind: 'class', filePath: 'packages/context-engine/src/ContextEngine.ts', range: { start: { line: 1, column: 0 }, end: { line: 10, column: 0 } } },
      ],
      []
    );

    const base1 = builder.build({ symbolGraph: graph });
    const base2 = builder.build({ symbolGraph: graph });

    expect(base1.hash).toBe(base2.hash);
  });
});
