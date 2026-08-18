import { DeveloperSession } from '../types/DeveloperSession.js';
import { SessionBoundaryDetector } from './SessionBoundaryDetector.js';
import { SessionEventReducer } from './SessionEventReducer.js';

export class SessionReconstructor {
  private boundaryDetector: SessionBoundaryDetector;
  private reducer: SessionEventReducer;

  constructor(inactivityThresholdMs = 30 * 60 * 1000) {
    this.boundaryDetector = new SessionBoundaryDetector(inactivityThresholdMs);
    this.reducer = new SessionEventReducer();
  }

  public reconstructFromEvents(workspace: string, events: any[]): DeveloperSession[] {
    if (events.length === 0) return [];

    const sessions: DeveloperSession[] = [];
    let currentSession: DeveloperSession | null = null;

    // Sort events deterministically by timestamp
    const sortedEvents = [...events].sort((a, b) =>
      (a.timestamp ?? '').localeCompare(b.timestamp ?? '')
    );

    for (const evt of sortedEvents) {
      const timestamp = evt.timestamp ?? new Date().toISOString();

      if (
        !currentSession ||
        evt.type === 'WORKSPACE_OPEN' ||
        this.boundaryDetector.isNewSession(currentSession.lastActivityTime, timestamp)
      ) {
        if (currentSession) {
          sessions.push(currentSession);
        }

        currentSession = {
          sessionId: `session_${workspace}_${Date.now()}_${sessions.length + 1}`,
          workspace,
          startTime: timestamp,
          lastActivityTime: timestamp,
          durationMs: 0,
          activeFiles: [],
          activeSymbols: [],
          recentChanges: [],
          detectedIntents: [],
          relatedDecisions: [],
          relatedBugs: [],
          relatedRefactors: [],
          activityLevel: 'ACTIVE',
          state: 'EXPLORING',
          confidence: 0.85,
          evidence: [
            {
              id: `ev_start_${timestamp}`,
              certainty: 'OBSERVED',
              source: 'event-store',
              description: `Session initiated from event ${evt.type}`,
              observedAt: timestamp,
              eventIds: [evt.id ?? 'evt_start'],
            },
          ],
          generatedAt: timestamp,
        };
      }

      currentSession = this.reducer.reduce(currentSession, evt);
    }

    if (currentSession) {
      sessions.push(currentSession);
    }

    return sessions;
  }
}
