import { EventRecord } from '@codememory/event-store';
import { MemoryIndex } from '../index/MemoryIndex.js';
import {
  FileMemory,
  SymbolMemory,
  DecisionMemory,
  SessionMemory,
  MemoryModel,
} from '../types/MemoryTypes.js';
import { createHash } from 'node:crypto';
import { ILogger } from '@codememory/logging';

export class MemoryBuilder {
  constructor(private readonly logger?: ILogger) {}

  public buildFromEvents(events: EventRecord[], targetIndex?: MemoryIndex): MemoryIndex {
    const index = targetIndex || new MemoryIndex();

    events.forEach((evt) => {
      this.interpretEvent(evt, index);
    });

    this.logger?.info(`[MemoryBuilder] Built ${index.getAll().length} memory models from ${events.length} events`);
    return index;
  }

  private interpretEvent(evt: EventRecord, index: MemoryIndex): void {
    const timestamp = evt.timestamp;

    // 1. File Modification Events
    if (evt.eventType === 'FILE_MODIFIED' || evt.eventType === 'ACTIVE_FILE_CHANGED') {
      const payload = evt.payload as { file?: string; filePath?: string };
      const filePath = payload?.file || payload?.filePath || evt.workspace;
      if (filePath) {
        let fileMem = index.getByFile(filePath);
        if (!fileMem) {
          fileMem = {
            id: `mem_file_${this.hashString(filePath)}`,
            type: 'file',
            filePath,
            summary: `Cognitive memory for file ${filePath}`,
            confidence: 0.9,
            importance: 0.7,
            recency: timestamp,
            sourceEvents: [evt.id],
            relationships: [],
            editCount: 1,
            authors: [evt.source],
            lastModifiedAt: timestamp,
          };
        } else {
          fileMem = {
            ...fileMem,
            editCount: fileMem.editCount + 1,
            recency: timestamp,
            lastModifiedAt: timestamp,
            sourceEvents: [...new Set([...fileMem.sourceEvents, evt.id])],
          };
        }
        index.index(fileMem);
      }
    }

    // 2. Decision Events (ADR)
    if (evt.eventType === 'RECORD_DECISION') {
      const payload = evt.payload as { title?: string; rationale?: string; boundSymbols?: string[] };
      const decisionTitle = payload.title || 'Architectural Decision';
      const decId = `mem_dec_${this.hashString(decisionTitle + timestamp)}`;

      const decMem: DecisionMemory = {
        id: decId,
        type: 'decision',
        decisionTitle,
        rationale: payload.rationale || '',
        author: evt.source,
        boundSymbols: payload.boundSymbols || [],
        summary: `ADR: ${decisionTitle}`,
        confidence: 1.0,
        importance: 0.95,
        recency: timestamp,
        sourceEvents: [evt.id],
        relationships: (payload.boundSymbols || []).map((sym) => ({
          targetMemoryId: `mem_sym_${this.hashString(sym)}`,
          type: 'BOUND_TO',
        })),
      };
      index.index(decMem);
    }

    // 3. Workspace Session Open / Close
    if (evt.eventType === 'WORKSPACE_OPEN' || evt.eventType === 'WORKSPACE_CLOSE') {
      const sessionId = (evt.metadata as { sessionId?: string })?.sessionId || `session_${evt.workspace}`;
      let sessMem = index.getBySession(sessionId);

      if (!sessMem) {
        sessMem = {
          id: `mem_sess_${this.hashString(sessionId)}`,
          type: 'session',
          sessionId,
          startTime: timestamp,
          summary: `Session memory for workspace ${evt.workspace}`,
          confidence: 1.0,
          importance: 0.5,
          recency: timestamp,
          sourceEvents: [evt.id],
          relationships: [],
          modifiedFilesCount: 0,
        };
      } else if (evt.eventType === 'WORKSPACE_CLOSE') {
        sessMem = {
          ...sessMem,
          endTime: timestamp,
          recency: timestamp,
          sourceEvents: [...new Set([...sessMem.sourceEvents, evt.id])],
        };
      }
      index.index(sessMem);
    }

    // 4. Intent Captured Events
    if (evt.eventType === 'INTENT_CAPTURED') {
      const payload = evt.payload as {
        intentType?: string;
        reason?: string;
        affectedFiles?: string[];
        confidence?: number;
      };
      const intentType = payload.intentType || 'Refactor';
      const goal = payload.reason || 'Developer intent extracted';

      const intentMem: MemoryModel = {
        id: `mem_intent_${this.hashString(goal + timestamp)}`,
        type: 'intent',
        intentType,
        goal,
        activeFiles: payload.affectedFiles || [evt.workspace],
        summary: `Intent [${intentType}]: ${goal}`,
        confidence: payload.confidence || 0.9,
        importance: payload.confidence || 0.9,
        recency: timestamp,
        sourceEvents: [evt.id],
        relationships: (payload.affectedFiles || []).map((file) => ({
          targetMemoryId: `mem_file_${this.hashString(file)}`,
          type: 'AFFECTS',
        })),
      };
      index.index(intentMem);
    }
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 12);
  }
}
