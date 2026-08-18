import { describe, it, expect, vi } from 'vitest';
import { ContextCollector } from '../context/ContextCollector.js';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { SymbolStoryEngine } from '@codememory/story-engine';
import { SessionIntelligenceEngine } from '@codememory/session-intelligence';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { ChangeImpactEngine } from '@codememory/change-impact';

describe('ContextCollector Unit Tests', () => {
  it('collects all cognitive engine context into AssistantContext', async () => {
    const mockQuery = { search: vi.fn().mockReturnValue({ items: [{ id: 'm1' }] }), findRecent: vi.fn().mockReturnValue([]) } as unknown as MemoryQueryEngine;
    const mockStory = { getStoryByName: vi.fn().mockResolvedValue({ id: 's1' }) } as unknown as SymbolStoryEngine;
    const mockSession = { getCurrentSession: vi.fn().mockReturnValue({ sessionId: 'sess1' }) } as unknown as SessionIntelligenceEngine;
    const mockDrift = { analyze: vi.fn().mockReturnValue([{ id: 'd1' }]) } as unknown as DriftSentinel;
    const mockImpact = { analyzeFile: vi.fn().mockReturnValue({ impactScore: 0.7 }) } as unknown as ChangeImpactEngine;

    const collector = new ContextCollector({
      queryEngine: mockQuery,
      storyEngine: mockStory,
      sessionEngine: mockSession,
      driftSentinel: mockDrift,
      impactEngine: mockImpact,
    });

    const context = await collector.collectContext({
      requestId: 'r1',
      prompt: 'Refactor main.ts',
      activeFilePath: 'src/main.ts',
      activeSymbolName: 'main',
    });

    expect(context.memories).toHaveLength(1);
    expect(context.symbolStory).toBeDefined();
    expect(context.sessionSummary).toBeDefined();
    expect(context.driftFindings).toHaveLength(1);
    expect(context.changeImpact).toBeDefined();
    expect(context.totalTokens).toBeGreaterThan(0);
  });

  it('handles uninitialized dependencies gracefully', async () => {
    const collector = new ContextCollector({});
    const context = await collector.collectContext({ requestId: 'r2', prompt: 'hello' });

    expect(context.memories).toHaveLength(0);
    expect(context.symbolStory).toBeUndefined();
    expect(context.sessionSummary).toBeUndefined();
    expect(context.driftFindings).toHaveLength(0);
  });

  it('collects change impact when only activeSymbolName is specified', async () => {
    const mockImpact = { analyzeSymbol: vi.fn().mockReturnValue({ impactScore: 0.4 }) } as unknown as ChangeImpactEngine;
    const collector = new ContextCollector({ impactEngine: mockImpact });

    const context = await collector.collectContext({
      requestId: 'r3',
      prompt: 'Check symbol impact',
      activeSymbolName: 'MySymbol',
    });

    expect(context.changeImpact).toBeDefined();
    expect(context.changeImpact.impactScore).toBe(0.4);
  });
});
