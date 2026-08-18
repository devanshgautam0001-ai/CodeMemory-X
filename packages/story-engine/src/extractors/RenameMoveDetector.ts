import { SymbolStatus } from '../types/StoryTypes.js';

export class RenameMoveDetector {
  public detectStatus(
    events: any[],
    currentPath: string,
    symbolName?: string
  ): { status: SymbolStatus; oldPaths: string[]; oldNames: string[] } {
    let status: SymbolStatus = 'ACTIVE';
    const oldPathsSet = new Set<string>();
    const oldNamesSet = new Set<string>();

    for (const evt of events) {
      const type = evt.type ?? evt.eventName ?? '';
      const payload = evt.payload ?? {};

      if (type === 'FILE_MOVED' || type === 'SYMBOL_MOVED') {
        const matchesPath = payload.newPath === currentPath || payload.filePath === currentPath || !payload.newPath;
        if (matchesPath && payload.oldPath) {
          status = 'MOVED';
          oldPathsSet.add(payload.oldPath);
        }
      } else if (type === 'FILE_RENAMED' || type === 'SYMBOL_RENAMED') {
        const matchesName =
          !symbolName ||
          payload.newName === symbolName ||
          payload.filePath === currentPath ||
          !payload.newName;
        if (matchesName && payload.oldName) {
          status = 'RENAMED';
          oldNamesSet.add(payload.oldName);
        }
      } else if (type === 'FILE_DELETED' || type === 'SYMBOL_DELETED') {
        if (payload.filePath === currentPath) {
          status = 'DELETED';
        }
      }
    }

    return {
      status,
      oldPaths: Array.from(oldPathsSet),
      oldNames: Array.from(oldNamesSet),
    };
  }
}
