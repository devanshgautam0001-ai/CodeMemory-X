import { StorySession } from '../types/StorySession.js';
import { SessionIntelligenceEngine } from '@codememory/session-intelligence';

export class SessionHistoryExtractor {
  public extractSessions(filePath: string, sessionEngine?: SessionIntelligenceEngine): StorySession[] {
    if (!sessionEngine) return [];

    const sessions: StorySession[] = [];
    const recent = sessionEngine.getRecentSessions(10);

    for (const sess of recent) {
      if (sess.activeFiles.some((f) => f.filePath === filePath)) {
        sessions.push({
          sessionId: sess.sessionId,
          startTime: sess.startTime,
          endTime: sess.lastActivityTime,
          state: sess.state,
          intent: sess.detectedIntents[0]?.type,
          changes: sess.recentChanges.length,
          decisions: sess.relatedDecisions.length,
          bugs: sess.relatedBugs.length,
          refactors: sess.relatedRefactors.length,
          confidence: sess.confidence,
        });
      }
    }

    return sessions;
  }
}
