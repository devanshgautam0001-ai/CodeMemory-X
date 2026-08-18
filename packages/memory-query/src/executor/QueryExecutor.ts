import { MemoryRepository, BaseMemory } from '@codememory/memory-engine';
import { MemoryQueryOptions } from '../types/MemoryQueryOptions.js';
import { SearchResult, RankedMemory, MemoryGroup } from '../types/SearchResult.js';
import { QueryParser } from '../parser/QueryParser.js';
import { QueryPlanner } from '../planner/QueryPlanner.js';
import { RankingEngine } from '../ranking/RankingEngine.js';

export class QueryExecutor {
  private parser: QueryParser;
  private planner: QueryPlanner;
  private ranker: RankingEngine;

  constructor(private readonly repository: MemoryRepository) {
    this.parser = new QueryParser();
    this.planner = new QueryPlanner();
    this.ranker = new RankingEngine();
  }

  public execute(options: MemoryQueryOptions): SearchResult {
    const startTime = Date.now();
    const parsedOpts = this.parser.parseOptions(options);
    const plan = this.planner.createPlan(parsedOpts);

    // 1. Fetch Candidate Memories from Repository
    let candidates: BaseMemory[] = [];
    if (plan.strategy === 'INDEX_FILE' && plan.targetKey) {
      const fileMem = this.repository.getFileMemory(plan.targetKey);
      if (fileMem) candidates.push(fileMem);
    } else if (plan.strategy === 'INDEX_SYMBOL' && plan.targetKey) {
      candidates = this.repository.getSymbolMemory(plan.targetKey);
    } else if (plan.strategy === 'INDEX_SESSION' && plan.targetKey) {
      const sessMem = this.repository.getSessionMemory(plan.targetKey);
      if (sessMem) candidates.push(sessMem);
    } else if (parsedOpts.query) {
      candidates = this.repository.searchMemory(parsedOpts.query);
    } else {
      candidates = this.repository.getAllMemories();
    }

    // 2. Filter Candidates
    const filtered = candidates.filter((mem) => {
      if (parsedOpts.types.length > 0 && !parsedOpts.types.includes(mem.type as any)) {
        return false;
      }
      if (parsedOpts.minImportance > 0 && mem.importance < parsedOpts.minImportance) {
        return false;
      }
      if (parsedOpts.minConfidence > 0 && mem.confidence < parsedOpts.minConfidence) {
        return false;
      }
      if (parsedOpts.fromTimestamp && mem.recency < parsedOpts.fromTimestamp) {
        return false;
      }
      if (parsedOpts.toTimestamp && mem.recency > parsedOpts.toTimestamp) {
        return false;
      }
      return true;
    });

    // 3. Rank Candidates
    let ranked = this.ranker.rankMemories(filtered);

    // 4. Sort Candidates
    if (parsedOpts.sortBy !== 'rank') {
      ranked.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (parsedOpts.sortBy === 'importance') {
          valA = a.memory.importance;
          valB = b.memory.importance;
        } else if (parsedOpts.sortBy === 'confidence') {
          valA = a.memory.confidence;
          valB = b.memory.confidence;
        } else if (parsedOpts.sortBy === 'recency') {
          valA = new Date(a.memory.recency).getTime();
          valB = new Date(b.memory.recency).getTime();
        }

        return parsedOpts.sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    }

    // 5. Group Candidates if requested
    let groups: MemoryGroup[] | undefined = undefined;
    if (parsedOpts.groupBy) {
      const groupMap = new Map<string, RankedMemory[]>();
      ranked.forEach((item) => {
        const key = parsedOpts.groupBy === 'file' ? (item.memory as any).filePath || 'global' : item.memory.type;
        const list = groupMap.get(key) || [];
        list.push(item);
        groupMap.set(key, list);
      });

      groups = Array.from(groupMap.entries()).map(([groupKey, items]) => ({
        groupKey,
        items,
      }));
    }

    // 6. Paginate Results
    const totalMatches = ranked.length;
    const totalPages = Math.ceil(totalMatches / parsedOpts.pageSize) || 1;
    const startIndex = (parsedOpts.page - 1) * parsedOpts.pageSize;
    const pageItems = ranked.slice(startIndex, startIndex + parsedOpts.pageSize);
    const executionTimeMs = Math.max(1, Date.now() - startTime);

    return {
      items: pageItems,
      groups,
      totalMatches,
      page: parsedOpts.page,
      pageSize: parsedOpts.pageSize,
      totalPages,
      executionTimeMs,
    };
  }

  public *streamExecute(options: MemoryQueryOptions): IterableIterator<BaseMemory> {
    const result = this.execute({ ...options, pageSize: 1000 });
    for (const item of result.items) {
      yield item.memory;
    }
  }
}
