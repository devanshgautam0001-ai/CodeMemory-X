import { StoryBirth } from '../types/StoryBirth.js';

export class BirthExtractor {
  public extractBirth(
    symbolId: string,
    name: string,
    filePath: string,
    events: any[],
    oldPaths: string[] = []
  ): StoryBirth {
    const validPaths = new Set([filePath, ...oldPaths]);

    const creationEvent = events.find(
      (e) => (e.payload?.filePath && validPaths.has(e.payload.filePath)) || e.payload?.symbolId === symbolId
    );

    const firstTime = creationEvent?.timestamp ?? (events.length > 0 ? events[0].timestamp : '1970-01-01T00:00:00.000Z');
    const author = creationEvent?.payload?.author;
    const commit = creationEvent?.payload?.commitHash;

    const rawRationale = creationEvent?.payload?.comment ?? creationEvent?.payload?.reason;
    const rationale = typeof rawRationale === 'string' && rawRationale.trim().length > 0 ? rawRationale.trim() : undefined;
    const rationaleCertainty = rationale ? 'OBSERVED' : 'UNKNOWN';

    return {
      firstObservedAt: firstTime,
      creationCommit: commit,
      author,
      filePath,
      location: {
        filePath,
        startLine: 1,
        startColumn: 0,
        endLine: 10,
        endColumn: 0,
      },
      rationale,
      rationaleCertainty,
      confidence: creationEvent ? 0.95 : 0.60,
      evidenceEventIds: creationEvent?.id ? [creationEvent.id] : [],
    };
  }
}
