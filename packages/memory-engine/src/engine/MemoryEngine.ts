import { EventStore, EventRecord } from '@codememory/event-store';
import { IEventBus } from '@codememory/event-bus';
import { Result, ok, fail } from '@codememory/shared';
import { MemoryRepository } from '../repository/MemoryRepository.js';
import { MemorySnapshot } from '../models/MemorySnapshot.js';
import {
  BaseMemory,
  FileMemory,
  SymbolMemory,
  SessionMemory,
} from '../types/MemoryTypes.js';
import { ILogger } from '@codememory/logging';

export class MemoryEngine {
  private repository: MemoryRepository;

  constructor(
    private readonly eventStore: EventStore,
    private readonly eventBus?: IEventBus,
    private readonly logger?: ILogger
  ) {
    this.repository = new MemoryRepository(this.logger);
  }

  public async rebuild(): Promise<Result<MemorySnapshot>> {
    try {
      this.logger?.info('[MemoryEngine] Rebuilding memory state from EventStore...');
      const eventsRes = await this.eventStore.getEvents();
      if (eventsRes.isFailure) return fail(eventsRes.error);

      const snapshot = this.repository.buildMemory(eventsRes.value);

      if (this.eventBus) {
        await this.eventBus.publish({
          id: `mem_evt_${Date.now()}`,
          type: 'MEMORY_UPDATED',
          source: 'memory-engine',
          timestamp: new Date().toISOString(),
          correlationId: `rebuild_${Date.now()}`,
          payload: {
            totalMemories: snapshot.memories.length,
            eventsProcessed: snapshot.totalEventsProcessed,
          },
          metadata: {
            version: snapshot.version,
          },
        });
      }

      this.logger?.info(`[MemoryEngine] Memory state rebuilt (${snapshot.memories.length} memories derived)`);
      return ok(snapshot);
    } catch (error) {
      this.logger?.error('Failed to rebuild Memory Engine state', error as Error);
      return fail(error as Error);
    }
  }

  public getMemory(id: string): BaseMemory | undefined {
    return this.repository.getMemory(id);
  }

  public getSymbolMemory(symbolName: string): SymbolMemory[] {
    return this.repository.getSymbolMemory(symbolName);
  }

  public getFileMemory(filePath: string): FileMemory | undefined {
    return this.repository.getFileMemory(filePath);
  }

  public getSessionMemory(sessionId: string): SessionMemory | undefined {
    return this.repository.getSessionMemory(sessionId);
  }

  public searchMemory(query: string): BaseMemory[] {
    return this.repository.searchMemory(query);
  }

  public saveMemory(memory: BaseMemory): void {
    this.repository.saveMemory(memory);
  }
}
