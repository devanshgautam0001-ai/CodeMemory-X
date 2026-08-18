import { DeveloperSession } from '../types/DeveloperSession.js';

export class SessionEventReducer {
  public reduce(session: DeveloperSession, event: any): DeveloperSession {
    const timestamp = event.timestamp ?? new Date().toISOString();
    const eventType = event.type ?? '';
    const payload = event.payload ?? {};

    const updatedSession = { ...session };
    updatedSession.lastActivityTime = timestamp;
    updatedSession.durationMs =
      new Date(timestamp).getTime() - new Date(updatedSession.startTime).getTime();

    if (payload.filePath) {
      const existingFile = updatedSession.activeFiles.find(
        (f) => f.filePath === payload.filePath
      );
      if (existingFile) {
        existingFile.lastSeen = timestamp;
        existingFile.editCount += 1;
      } else {
        updatedSession.activeFiles.push({
          filePath: payload.filePath,
          firstSeen: timestamp,
          lastSeen: timestamp,
          editCount: 1,
          changeCount: 1,
          isActive: true,
          relatedSymbols: [],
          importance: 0.8,
          confidence: 0.95,
        });
      }

      updatedSession.recentChanges.push({
        id: event.id ?? `evt_${Date.now()}`,
        type: eventType,
        filePath: payload.filePath,
        timestamp,
      });
    }

    if (payload.symbolId || payload.symbolName) {
      const symId = payload.symbolId ?? payload.symbolName;
      const existingSym = updatedSession.activeSymbols.find((s) => s.symbolId === symId);
      if (existingSym) {
        existingSym.touchCount += 1;
      } else {
        updatedSession.activeSymbols.push({
          symbolId: symId,
          name: payload.symbolName ?? symId,
          filePath: payload.filePath ?? '',
          touchCount: 1,
          changeCount: 1,
          relationshipCount: 0,
          impactScore: 0.5,
          confidence: 0.9,
          isPrimaryFocus: false,
        });
      }
    }

    updatedSession.generatedAt = new Date().toISOString();
    return updatedSession;
  }
}
