import { describe, it, expect } from 'vitest';
import { SessionIntelligenceEngine } from '../engine/SessionIntelligenceEngine.js';

describe('SessionIntelligenceEngine (Deterministic Execution)', () => {
  it('produces identical session states for identical event sequences', () => {
    const engine1 = new SessionIntelligenceEngine();
    const engine2 = new SessionIntelligenceEngine();

    const evt1 = { id: 'evt1', type: 'FILE_MODIFIED', workspace: 'ws1', payload: { filePath: 'src/service.ts' } };
    const evt2 = { id: 'evt2', type: 'FILE_MODIFIED', workspace: 'ws1', payload: { filePath: 'src/service.ts' } };

    const s1 = engine1.recordEvent(evt1);
    engine1.recordEvent(evt2);

    const s2 = engine2.recordEvent(evt1);
    engine2.recordEvent(evt2);

    const curr1 = engine1.getCurrentSession()!;
    const curr2 = engine2.getCurrentSession()!;

    expect(curr1.state).toBe(curr2.state);
    expect(curr1.activityLevel).toBe(curr2.activityLevel);
    expect(curr1.activeFiles.length).toBe(curr2.activeFiles.length);
  });

  it('supports session reconstruction from event history', () => {
    const engine = new SessionIntelligenceEngine();
    const events = [
      { id: 'e1', type: 'WORKSPACE_OPEN', timestamp: '2026-08-09T09:00:00.000Z', payload: { filePath: 'src/a.ts' } },
      { id: 'e2', type: 'FILE_MODIFIED', timestamp: '2026-08-09T09:10:00.000Z', payload: { filePath: 'src/a.ts' } },
    ];

    const rebuilt = engine.rebuildFromEvents('ws1', events);
    expect(rebuilt.length).toBe(1);
    expect(engine.getCurrentSession()?.sessionId).toBe(rebuilt[0].sessionId);
  });
});
