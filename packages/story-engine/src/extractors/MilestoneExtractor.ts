import { StoryMilestone } from '../types/StoryMilestone.js';
import { MilestoneType } from '../types/StoryTypes.js';

export class MilestoneExtractor {
  public extractMilestones(
    symbolId: string,
    filePath: string,
    events: any[],
    oldPaths: string[] = [],
    oldNames: string[] = []
  ): StoryMilestone[] {
    const validPaths = new Set([filePath, ...oldPaths]);
    const validNames = new Set(oldNames);

    const milestones: StoryMilestone[] = [];
    const seenEvents = new Set<string>();

    for (const evt of events) {
      const evtId = evt.id ?? `evt_${evt.timestamp}_${milestones.length}`;
      if (seenEvents.has(evtId)) continue;

      const evtPath = evt.payload?.filePath ?? evt.payload?.newPath ?? evt.payload?.oldPath;
      const evtName = evt.payload?.symbolName ?? evt.payload?.oldName ?? evt.payload?.newName;
      const isRelevant =
        (evtPath && validPaths.has(evtPath)) ||
        (evtName && validNames.has(evtName)) ||
        evt.payload?.symbolId === symbolId;

      if (!isRelevant) continue;

      seenEvents.add(evtId);

      const timestamp = evt.timestamp ?? '1970-01-01T00:00:00.000Z';
      const evtType = evt.type ?? evt.eventName ?? '';
      let type: MilestoneType = 'MODIFIED';
      let title = `Modified ${filePath}`;

      if (evtType === 'WORKSPACE_OPEN' || evtType === 'FILE_OPEN') {
        type = 'ADDED';
        title = `Added ${evtPath ?? filePath} to workspace`;
      } else if (evtType === 'FILE_RENAMED' || evtType === 'SYMBOL_RENAMED') {
        type = 'RENAMED';
        title = `Renamed symbol ${evt.payload?.oldName ?? ''} → ${evt.payload?.newName ?? symbolId}`;
      } else if (evtType === 'FILE_MOVED' || evtType === 'SYMBOL_MOVED') {
        type = 'MOVED';
        title = `Moved ${evt.payload?.oldPath ?? ''} → ${evt.payload?.newPath ?? filePath}`;
      } else if (evtType === 'RECORD_DECISION') {
        type = 'DECISION';
        title = `ADR decision recorded for ${filePath}`;
      } else if (evtType === 'BUG_EVENT') {
        type = 'BUG_FIXED';
        title = `Bug resolved for ${filePath}`;
      } else if (evtType === 'REFACTOR_EVENT') {
        type = 'REFACTORED';
        title = `Refactored ${filePath}`;
      }

      milestones.push({
        id: `ms_${evtId}`,
        timestamp,
        type,
        title,
        summary: evt.payload?.summary ?? evt.payload?.comment ?? title,
        commitHash: evt.payload?.commitHash,
        sessionId: evt.payload?.sessionId,
        changedFiles: Array.from(new Set([filePath, ...(evtPath ? [evtPath] : [])])),
        relatedSymbols: [symbolId],
        evidenceEventIds: [evtId],
        confidence: 0.95,
      });
    }

    // Sort chronologically, then by ID deterministically
    return milestones.sort((a, b) => {
      const cmp = a.timestamp.localeCompare(b.timestamp);
      if (cmp !== 0) return cmp;
      return a.id.localeCompare(b.id);
    });
  }
}
