import { BaseMemory } from '@codememory/memory-engine';

export class ContextBudgetManager {
  public estimateTokens(text: string): number {
    if (!text) return 0;
    // Approximating 4 characters per token
    return Math.ceil(text.length / 4);
  }

  public estimateMemoriesTokens(memories: BaseMemory[]): number {
    return memories.reduce((acc, mem) => acc + this.estimateTokens(JSON.stringify(mem)), 0);
  }

  public trimToBudget<T extends BaseMemory>(items: T[], maxTokens: number): { trimmed: T[]; isTrimmed: boolean } {
    const result: T[] = [];
    let currentTokens = 0;
    let isTrimmed = false;

    for (const item of items) {
      const itemTokens = this.estimateTokens(JSON.stringify(item));
      if (currentTokens + itemTokens <= maxTokens) {
        result.push(item);
        currentTokens += itemTokens;
      } else {
        isTrimmed = true;
        break;
      }
    }

    return { trimmed: result, isTrimmed };
  }
}
