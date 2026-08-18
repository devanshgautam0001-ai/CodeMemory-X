import { BaseMemory } from '@codememory/memory-engine';

export interface RankedMemory {
  memory: BaseMemory;
  score: number;
  rank: number;
}

export interface MemoryGroup {
  groupKey: string;
  items: RankedMemory[];
}

export interface SearchResult {
  items: RankedMemory[];
  groups?: MemoryGroup[];
  totalMatches: number;
  page: number;
  pageSize: number;
  totalPages: number;
  executionTimeMs: number;
}
