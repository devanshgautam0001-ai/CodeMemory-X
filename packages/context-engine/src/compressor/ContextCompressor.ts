import { BaseMemory, FileMemory, SessionMemory } from '@codememory/memory-engine';

export class ContextCompressor {
  public compressMemories(memories: BaseMemory[]): BaseMemory[] {
    const memoryMap = new Map<string, BaseMemory>();

    for (const mem of memories) {
      if (!memoryMap.has(mem.id)) {
        memoryMap.set(mem.id, {
          ...mem,
          sourceEvents: [...new Set(mem.sourceEvents || [])],
        });
      } else {
        const existing = memoryMap.get(mem.id)!;
        memoryMap.set(mem.id, {
          ...existing,
          confidence: Math.max(existing.confidence, mem.confidence),
          importance: Math.max(existing.importance, mem.importance),
          recency: new Date(existing.recency) > new Date(mem.recency) ? existing.recency : mem.recency,
          sourceEvents: [...new Set([...existing.sourceEvents, ...(mem.sourceEvents || [])])],
        });
      }
    }

    return Array.from(memoryMap.values());
  }

  public collapseSessions(sessions: SessionMemory[]): SessionMemory | undefined {
    if (sessions.length === 0) return undefined;
    if (sessions.length === 1) return sessions[0];

    const sorted = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      ...first,
      endTime: last.endTime || last.recency,
      modifiedFilesCount: sorted.reduce((sum, s) => sum + s.modifiedFilesCount, 0),
      summary: `Collapsed ${sessions.length} development sessions from ${first.startTime} to ${last.recency}`,
      sourceEvents: [...new Set(sorted.flatMap((s) => s.sourceEvents))],
    };
  }

  public summarizeFileEdits(files: FileMemory[]): FileMemory[] {
    const map = new Map<string, FileMemory>();

    for (const file of files) {
      const pathKey = file.filePath.toLowerCase();
      if (!map.has(pathKey)) {
        map.set(pathKey, file);
      } else {
        const existing = map.get(pathKey)!;
        map.set(pathKey, {
          ...existing,
          editCount: existing.editCount + file.editCount,
          authors: [...new Set([...existing.authors, ...file.authors])],
          lastModifiedAt: new Date(existing.lastModifiedAt) > new Date(file.lastModifiedAt) ? existing.lastModifiedAt : file.lastModifiedAt,
        });
      }
    }

    return Array.from(map.values());
  }
}
