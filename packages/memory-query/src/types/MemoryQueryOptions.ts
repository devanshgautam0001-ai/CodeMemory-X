export type MemoryTypeFilter =
  | 'file'
  | 'symbol'
  | 'session'
  | 'decision'
  | 'bug'
  | 'refactor'
  | 'intent';

export type SortByField = 'rank' | 'importance' | 'confidence' | 'recency';
export type SortOrder = 'asc' | 'desc';
export type GroupByField = 'type' | 'file';

export interface MemoryQueryOptions {
  query?: string;
  types?: MemoryTypeFilter[];
  filePath?: string;
  symbolName?: string;
  sessionId?: string;
  workspace?: string;
  correlationId?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  minImportance?: number;
  minConfidence?: number;

  // Pagination & Sorting
  page?: number;
  pageSize?: number;
  sortBy?: SortByField;
  sortOrder?: SortOrder;
  groupBy?: GroupByField;
}
