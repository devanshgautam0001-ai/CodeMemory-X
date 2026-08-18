import { MemoryQueryOptions } from '../types/MemoryQueryOptions.js';

export type ExecutionStrategy = 'INDEX_FILE' | 'INDEX_SYMBOL' | 'INDEX_SESSION' | 'SCAN_ALL';

export interface QueryPlan {
  strategy: ExecutionStrategy;
  targetKey?: string;
  normalizedOptions: MemoryQueryOptions;
}

export class QueryPlanner {
  public createPlan(options: MemoryQueryOptions): QueryPlan {
    if (options.filePath) {
      return { strategy: 'INDEX_FILE', targetKey: options.filePath, normalizedOptions: options };
    }
    if (options.symbolName) {
      return { strategy: 'INDEX_SYMBOL', targetKey: options.symbolName, normalizedOptions: options };
    }
    if (options.sessionId) {
      return { strategy: 'INDEX_SESSION', targetKey: options.sessionId, normalizedOptions: options };
    }
    return { strategy: 'SCAN_ALL', normalizedOptions: options };
  }
}
