import { describe, it, expect } from 'vitest';
import { SessionStateClassifier } from '../classification/SessionStateClassifier.js';
import { DeveloperSession } from '../types/DeveloperSession.js';

describe('SessionStateClassifier', () => {
  const classifier = new SessionStateClassifier();

  it('classifies REFACTORING when refactor intents exist', () => {
    const session: DeveloperSession = {
      sessionId: 's1',
      workspace: 'ws',
      startTime: '2026-08-09T10:00:00.000Z',
      lastActivityTime: '2026-08-09T10:10:00.000Z',
      durationMs: 600000,
      activeFiles: [{ filePath: 'src/app.ts', firstSeen: '', lastSeen: '', editCount: 2, changeCount: 1, isActive: true, relatedSymbols: [], importance: 1, confidence: 1 }],
      activeSymbols: [],
      recentChanges: [],
      detectedIntents: [{ intentId: 'i1', type: 'Refactor', description: 'Renamed method', confidence: 0.95, evidenceEventIds: [], observedAt: '' }],
      relatedDecisions: [],
      relatedBugs: [],
      relatedRefactors: [],
      activityLevel: 'ACTIVE',
      state: 'EXPLORING',
      confidence: 0.9,
      evidence: [],
      generatedAt: '',
    };

    const res = classifier.classifyState(session);
    expect(res.state).toBe('REFACTORING');
    expect(res.evidence.length).toBeGreaterThan(0);
  });
});
