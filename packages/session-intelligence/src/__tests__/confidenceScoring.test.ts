import { describe, it, expect } from 'vitest';
import { SessionConfidenceScorer } from '../scoring/SessionConfidenceScorer.js';
import { DeveloperSession } from '../types/DeveloperSession.js';

describe('SessionConfidenceScorer', () => {
  const scorer = new SessionConfidenceScorer();

  it('calculates explainable session confidence based on evidence quality', () => {
    const session: DeveloperSession = {
      sessionId: 's1',
      workspace: 'ws',
      startTime: '',
      lastActivityTime: '',
      durationMs: 0,
      activeFiles: [{ filePath: 'a.ts', firstSeen: '', lastSeen: '', editCount: 1, changeCount: 1, isActive: true, relatedSymbols: [], importance: 1, confidence: 1 }],
      activeSymbols: [],
      recentChanges: [],
      detectedIntents: [],
      relatedDecisions: [],
      relatedBugs: [],
      relatedRefactors: [],
      activityLevel: 'ACTIVE',
      state: 'IMPLEMENTING',
      confidence: 0,
      evidence: [
        { id: 'e1', certainty: 'OBSERVED', source: 'test', description: '', observedAt: '', eventIds: [] },
        { id: 'e2', certainty: 'OBSERVED', source: 'test', description: '', observedAt: '', eventIds: [] },
      ],
      generatedAt: '',
    };

    const conf = scorer.calculateConfidence(session);
    expect(conf).toBeGreaterThan(0.80);
    expect(conf).toBeLessThanOrEqual(1.0);
  });
});
