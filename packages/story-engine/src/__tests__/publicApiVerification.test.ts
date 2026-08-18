import { describe, it, expect } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('Public API Contract Verification', () => {
  const engine = new SymbolStoryEngine();

  it('implements all 16 required public SymbolStoryEngine APIs', async () => {
    const sId = 'sym_test';
    const story = await engine.getStory(sId, 'TestSymbol', 'src/test.ts');
    expect(story).toBeDefined();

    const byName = await engine.getStoryByName('TestSymbol', 'src/test.ts');
    expect(byName).toBeDefined();

    const timeline = await engine.getStoryTimeline(sId);
    expect(Array.isArray(timeline)).toBe(true);

    const birth = await engine.getBirth(sId);
    expect(birth).toBeDefined();

    const contributors = await engine.getContributors(sId);
    expect(Array.isArray(contributors)).toBe(true);

    const decisions = await engine.getDecisions(sId);
    expect(Array.isArray(decisions)).toBe(true);

    const bugs = await engine.getBugs(sId);
    expect(Array.isArray(bugs)).toBe(true);

    const refactors = await engine.getRefactors(sId);
    expect(Array.isArray(refactors)).toBe(true);

    const dependencies = await engine.getDependencies(sId);
    expect(Array.isArray(dependencies)).toBe(true);

    const sessions = await engine.getSessions(sId);
    expect(Array.isArray(sessions)).toBe(true);

    const metrics = await engine.getMetrics(sId);
    expect(metrics).toBeDefined();

    const risks = await engine.getRiskHistory(sId);
    expect(Array.isArray(risks)).toBe(true);

    const evidence = await engine.getEvidence(sId);
    expect(Array.isArray(evidence)).toBe(true);

    const rebuilt = await engine.rebuild(sId, 'TestSymbol', 'src/test.ts');
    expect(rebuilt).toBeDefined();

    const allRebuilt = await engine.rebuildAll();
    expect(Array.isArray(allRebuilt)).toBe(true);

    engine.clear();
    const repo = (engine as any).repo;
    expect(repo.getBySymbolId(sId)).toBeUndefined();
  });
});
