import { BaseMemory } from '@codememory/memory-engine';
import { RankedMemory } from '../types/SearchResult.js';

export class RankingEngine {
  public rankMemories(memories: BaseMemory[]): RankedMemory[] {
    const now = Date.now();

    const scored = memories.map((mem) => {
      const importanceScore = Math.max(0, Math.min(1, mem.importance || 0.5));
      const confidenceScore = Math.max(0, Math.min(1, mem.confidence || 0.5));

      // Calculate Recency Score (decay over 30 days)
      const memTime = new Date(mem.recency).getTime();
      const ageHours = Math.max(0, (now - memTime) / (1000 * 60 * 60));
      const recencyScore = Math.exp(-ageHours / 168); // Decay half-life ~ 1 week

      // Calculate Relationship Score (cap at 10 relations)
      const relCount = mem.relationships?.length || 0;
      const relationshipScore = Math.min(1.0, relCount / 10);

      // Weighted Composite Ranking Score
      const score =
        importanceScore * 0.35 +
        confidenceScore * 0.25 +
        recencyScore * 0.25 +
        relationshipScore * 0.15;

      return {
        memory: mem,
        score: Number(score.toFixed(4)),
        rank: 0,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    scored.forEach((item, index) => {
      item.rank = index + 1;
    });

    return scored;
  }
}
