import { describe, it, expect, vi } from 'vitest';
import { SessionHistoryExtractor } from '../extractors/SessionHistoryExtractor.js';

describe('SessionHistoryExtractor', () => {
  const extractor = new SessionHistoryExtractor();

  it('extracts sessions touching target file path', () => {
    const mockSessionEngine = {
      getRecentSessions: vi.fn().mockReturnValue([
        {
          sessionId: 'sess_1',
          startTime: '2026-08-09T10:00:00.000Z',
          lastActivityTime: '2026-08-09T10:30:00.000Z',
          state: 'REFACTORING',
          activeFiles: [{ filePath: 'src/auth.ts' }],
          detectedIntents: [{ type: 'Refactor' }],
          recentChanges: [1, 2],
          relatedDecisions: [],
          relatedBugs: [],
          relatedRefactors: [],
          confidence: 0.94,
        },
      ]),
    } as any;

    const sessions = extractor.extractSessions('src/auth.ts', mockSessionEngine);
    expect(sessions.length).toBe(1);
    expect(sessions[0].sessionId).toBe('sess_1');
  });
});
