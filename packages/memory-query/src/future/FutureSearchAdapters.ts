import { BaseMemory } from '@codememory/memory-engine';
import { MemoryQueryOptions } from '../types/MemoryQueryOptions.js';
import { SearchResult } from '../types/SearchResult.js';
import { Result } from '@codememory/shared';

export interface INaturalLanguageQueryInterface {
  translateToQueryOptions(nlQuery: string): Promise<Result<MemoryQueryOptions>>;
}

export interface IEmbeddingAdapter {
  generateEmbedding(text: string): Promise<Result<number[]>>;
}

export interface IVectorSearchAdapter {
  searchVector(embedding: number[], topK?: number): Promise<Result<Array<{ id: string; distance: number }>>>;
}

export interface IHybridSearch {
  hybridSearch(
    keywordQuery: MemoryQueryOptions,
    vectorEmbedding?: number[],
    vectorWeight?: number
  ): Promise<Result<SearchResult>>;
}
