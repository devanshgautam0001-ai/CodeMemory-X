import { describe, it, expect, vi } from 'vitest';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { registerBuiltInCodeMemoryTools } from '../builtin/BuiltInTools.js';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { SymbolStoryEngine } from '@codememory/story-engine';
import { ChangeImpactEngine } from '@codememory/change-impact';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { SessionIntelligenceEngine } from '@codememory/session-intelligence';
import { RelationshipEngine } from '@codememory/relationship-engine';

describe('DeterministicResults Unit Tests', () => {
  it('registers all 6 read-only built-in CodeMemory tools cleanly', () => {
    const registry = new ToolRegistry();
    registerBuiltInCodeMemoryTools(registry, {});

    const definitions = registry.getDefinitions();
    expect(definitions).toHaveLength(6);

    const names = definitions.map((d) => d.name);
    expect(names).toContain('search_memories');
    expect(names).toContain('get_symbol_story');
    expect(names).toContain('get_change_impact');
    expect(names).toContain('get_architectural_drift');
    expect(names).toContain('get_session');
    expect(names).toContain('get_relationships');
  });

  it('executes read-only built-in tools deterministically against mocked engines', async () => {
    const registry = new ToolRegistry();
    const mockQueryEngine = { search: vi.fn().mockReturnValue({ items: [{ memory: { id: 'm1' } }] }) } as unknown as MemoryQueryEngine;
    const mockStoryEngine = { getStoryByName: vi.fn().mockResolvedValue({ id: 's1', milestones: [] }) } as unknown as SymbolStoryEngine;
    const mockImpactEngine = { analyzeSymbol: vi.fn().mockReturnValue({ impactScore: 0.5 }), analyzeFile: vi.fn().mockReturnValue({ impactScore: 0.8 }) } as unknown as ChangeImpactEngine;
    const mockDriftEngine = { analyze: vi.fn().mockReturnValue([{ id: 'd1' }]) } as unknown as DriftSentinel;
    const mockSessionEngine = { getCurrentSession: vi.fn().mockReturnValue({ sessionId: 'sess1' }) } as unknown as SessionIntelligenceEngine;
    const mockRelEngine = { findRelationships: vi.fn().mockReturnValue([{ id: 'rel1' }]) } as unknown as RelationshipEngine;

    registerBuiltInCodeMemoryTools(registry, {
      memoryQueryEngine: mockQueryEngine,
      storyEngine: mockStoryEngine,
      impactEngine: mockImpactEngine,
      driftEngine: mockDriftEngine,
      sessionEngine: mockSessionEngine,
      relationshipEngine: mockRelEngine,
    });

    const ctx = { requestId: 'r', executionId: 'e', toolCallId: 't' };

    const res1 = await registry.resolve('search_memories').execute({ query: 'main' }, ctx);
    const res2 = await registry.resolve('get_symbol_story').execute({ symbolName: 'MyClass' }, ctx);
    const res3 = await registry.resolve('get_change_impact').execute({ target: 'MyClass' }, ctx);
    const res4 = await registry.resolve('get_architectural_drift').execute({}, ctx);
    const res5 = await registry.resolve('get_session').execute({}, ctx);
    const res6 = await registry.resolve('get_relationships').execute({ symbolName: 'MyClass' }, ctx);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res3.success).toBe(true);
    expect(res4.success).toBe(true);
    expect(res5.success).toBe(true);
    expect(res6.success).toBe(true);
  });
});
