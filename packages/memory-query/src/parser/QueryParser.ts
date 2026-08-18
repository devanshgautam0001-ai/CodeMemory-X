import { MemoryQueryOptions } from '../types/MemoryQueryOptions.js';

export class QueryParser {
  public parseOptions(options: MemoryQueryOptions): Required<MemoryQueryOptions> {
    return {
      query: options.query?.trim() || '',
      types: options.types || [],
      filePath: options.filePath || '',
      symbolName: options.symbolName || '',
      sessionId: options.sessionId || '',
      workspace: options.workspace || '',
      correlationId: options.correlationId || '',
      fromTimestamp: options.fromTimestamp || '',
      toTimestamp: options.toTimestamp || '',
      minImportance: options.minImportance ?? 0.0,
      minConfidence: options.minConfidence ?? 0.0,
      page: options.page && options.page > 0 ? options.page : 1,
      pageSize: options.pageSize && options.pageSize > 0 ? options.pageSize : 20,
      sortBy: options.sortBy || 'rank',
      sortOrder: options.sortOrder || 'desc',
      groupBy: options.groupBy || 'type',
    };
  }
}
