import { MemoryIndex } from '../index/MemoryIndex.js';
import { MemoryBuilder } from '../builder/MemoryBuilder.js';
import { MemorySnapshot } from '../models/MemorySnapshot.js';
import {
  BaseMemory,
  FileMemory,
  SymbolMemory,
  SessionMemory,
  MemoryModel,
} from '../types/MemoryTypes.js';
import { EventRecord } from '@codememory/event-store';
import { ILogger } from '@codememory/logging';

export class MemoryRepository {
  private index: MemoryIndex = new MemoryIndex();
  private builder: MemoryBuilder;

  constructor(private readonly logger?: ILogger) {
    this.builder = new MemoryBuilder(this.logger);
  }

  public buildMemory(events: EventRecord[]): MemorySnapshot {
    this.index.clear();
    this.builder.buildFromEvents(events, this.index);

    return new MemorySnapshot({
      version: 1,
      createdAt: new Date().toISOString(),
      memories: this.index.getAll(),
      totalEventsProcessed: events.length,
    });
  }

  public getMemory(id: string): BaseMemory | undefined {
    return this.index.get(id);
  }

  public getSymbolMemory(symbolName: string): SymbolMemory[] {
    return this.index.getBySymbol(symbolName);
  }

  public getFileMemory(filePath: string): FileMemory | undefined {
    return this.index.getByFile(filePath);
  }

  public getSessionMemory(sessionId: string): SessionMemory | undefined {
    return this.index.getBySession(sessionId);
  }

  public searchMemory(query: string): BaseMemory[] {
    return this.index.search(query);
  }

  public getAllMemories(): MemoryModel[] {
    return this.index.getAll();
  }

  public saveMemory(memory: BaseMemory): void {
    this.index.index(memory as any);
  }
}
