import { DecisionObject } from '../types/DecisionTypes.js';

export class GraphDecisionExtractor {
  public extractFromEvent(
    eventType: string,
    payload: Record<string, unknown>,
    modifiedFiles: string[] = [],
    sessionId?: string
  ): DecisionObject | null {
    const timestamp = new Date().toISOString();

    // 1. Dependency modifications in package.json
    if (eventType === 'DEPENDENCY_CHANGED' || (payload.filePath as string)?.endsWith('package.json')) {
      const added = (payload.addedDependencies as string[]) ?? [];
      const removed = (payload.removedDependencies as string[]) ?? [];
      if (added.length > 0 || removed.length > 0) {
        return {
          id: `dec_dep_${Date.now()}`,
          title: `Dependency Architecture Change (${added.length} added, ${removed.length} removed)`,
          description: `Dependencies modified in package.json: Added [${added.join(', ')}], Removed [${removed.join(', ')}]`,
          reason: 'Dependency modifications change runtime boundaries and external framework usage',
          confidence: 0.95,
          timestamp,
          relatedSymbols: [],
          relatedFiles: ['package.json'],
          relatedIntents: [],
          relatedSessions: sessionId ? [sessionId] : [],
          status: 'accepted',
          metadata: { added, removed },
        };
      }
    }

    // 2. Folder Moves & Directory Restructuring
    if (eventType === 'FOLDER_MOVED' || eventType === 'RESTRUCTURE_DETECTED') {
      const oldFolder = (payload.oldFolderPath as string) ?? (payload.oldPath as string) ?? '';
      const newFolder = (payload.newFolderPath as string) ?? (payload.newPath as string) ?? '';
      return {
        id: `dec_folder_${Date.now()}`,
        title: `Package/Folder Restructuring (${oldFolder || 'Directory'} -> ${newFolder || 'Target'})`,
        description: `Architecture restructuring moved directory contents from ${oldFolder} to ${newFolder}`,
        reason: 'Restructuring package directories impacts module boundaries and imports',
        confidence: 0.92,
        timestamp,
        relatedSymbols: [],
        relatedFiles: modifiedFiles,
        relatedIntents: [],
        relatedSessions: sessionId ? [sessionId] : [],
        status: 'accepted',
        metadata: { oldFolder, newFolder },
      };
    }

    // 3. Multi-File Edit Sessions (>3 files modified in single edit session)
    if (modifiedFiles.length >= 4) {
      return {
        id: `dec_session_${Date.now()}`,
        title: `Multi-Module Architectural Edit (${modifiedFiles.length} files affected)`,
        description: `High-impact multi-file editing session touching: ${modifiedFiles.slice(0, 3).join(', ')}...`,
        reason: 'Edits spanning multiple modules indicate cross-cutting architectural changes',
        confidence: 0.88,
        timestamp,
        relatedSymbols: [],
        relatedFiles: modifiedFiles,
        relatedIntents: [],
        relatedSessions: sessionId ? [sessionId] : [],
        status: 'accepted',
        metadata: { filesCount: modifiedFiles.length },
      };
    }

    return null;
  }
}
