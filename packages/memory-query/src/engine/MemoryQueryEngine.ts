import { MemoryRepository, BaseMemory, FileMemory, SymbolMemory } from '@codememory/memory-engine';
import { MemoryQueryOptions } from '../types/MemoryQueryOptions.js';
import { SearchResult } from '../types/SearchResult.js';
import { QueryExecutor } from '../executor/QueryExecutor.js';
import { ILogger } from '@codememory/logging';

export class MemoryQueryEngine {
  private executor: QueryExecutor;

  constructor(
    private readonly repository: MemoryRepository,
    private readonly logger?: ILogger
  ) {
    this.executor = new QueryExecutor(this.repository);
  }

  public search(options: MemoryQueryOptions): SearchResult {
    this.logger?.info('[MemoryQueryEngine] Executing search query', { options });
    return this.executor.execute(options);
  }

  public streamSearch(options: MemoryQueryOptions): IterableIterator<BaseMemory> {
    return this.executor.streamExecute(options);
  }

  public findByFile(filePath: string): FileMemory | undefined {
    return this.repository.getFileMemory(filePath);
  }

  public findBySymbol(symbolName: string): SymbolMemory[] {
    return this.repository.getSymbolMemory(symbolName);
  }

  public findRelated(memoryId: string): BaseMemory[] {
    const memory = this.repository.getMemory(memoryId);
    if (!memory || !memory.relationships) return [];

    const relatedIds = memory.relationships.map((r) => r.targetMemoryId);
    return relatedIds
      .map((id) => this.repository.getMemory(id))
      .filter((m): m is BaseMemory => m !== undefined);
  }

  public findRecent(limit = 10): BaseMemory[] {
    const res = this.search({ sortBy: 'recency', sortOrder: 'desc', pageSize: limit });
    return res.items.map((i) => i.memory);
  }

  public findImportant(threshold = 0.8): BaseMemory[] {
    const res = this.search({ minImportance: threshold, sortBy: 'importance', sortOrder: 'desc' });
    return res.items.map((i) => i.memory);
  }

  public findByWorkspace(workspace: string): BaseMemory[] {
    const res = this.search({ workspace });
    return res.items.map((i) => i.memory);
  }
}
