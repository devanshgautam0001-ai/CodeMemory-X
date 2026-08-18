import { AssistantContext } from '../types/AssistantContext.js';
import { PromptBudgetManager } from './PromptBudgetManager.js';

export class ContextCompressor {
  constructor(private readonly budgetManager: PromptBudgetManager) {}

  public compress(context: AssistantContext, maxContextTokens: number): AssistantContext {
    let currentEst = context.totalTokens;
    if (currentEst <= maxContextTokens) {
      return context;
    }

    const scores = context.evidenceScores ?? {};

    const getWeight = (priorityStr?: string): number => {
      switch (priorityStr) {
        case 'CRITICAL':
          return 4;
        case 'HIGH':
          return 3;
        case 'MEDIUM':
          return 2;
        case 'LOW':
          return 1;
        default:
          return 1;
      }
    };

    // Sort memories ascending for pruning (lowest priority, lowest score first)
    const sortedMemories = [...context.memories].sort((a, b) => {
      const metaA = scores[a.id];
      const metaB = scores[b.id];
      const pWeightA = getWeight(metaA?.priority);
      const pWeightB = getWeight(metaB?.priority);
      if (pWeightA !== pWeightB) return pWeightA - pWeightB;

      const scoreA = metaA?.score ?? 0;
      const scoreB = metaB?.score ?? 0;
      return scoreA - scoreB;
    });

    const sortedDecisions = [...context.decisions].sort((a, b) => {
      const metaA = scores[a.id];
      const metaB = scores[b.id];
      const pWeightA = getWeight(metaA?.priority);
      const pWeightB = getWeight(metaB?.priority);
      if (pWeightA !== pWeightB) return pWeightA - pWeightB;

      const scoreA = metaA?.score ?? 0;
      const scoreB = metaB?.score ?? 0;
      return scoreA - scoreB;
    });

    const compressed: AssistantContext = {
      ...context,
      memories: [...context.memories],
      decisions: [...context.decisions],
      driftFindings: [...context.driftFindings],
    };

    // Prune lowest-priority, lowest-score memories first
    while (compressed.memories.length > 0 && currentEst > maxContextTokens) {
      const lowestMem = sortedMemories.shift();
      const removed = lowestMem
        ? compressed.memories.find((m) => m.id === lowestMem.id)
        : compressed.memories.pop();
      if (lowestMem) {
        compressed.memories = compressed.memories.filter((m) => m.id !== lowestMem.id);
      }
      if (removed) {
        const removedTokens = Math.ceil(JSON.stringify(removed).length / 4);
        currentEst = Math.max(0, currentEst - removedTokens);
      }
    }

    // Prune lowest-priority decisions if still over budget
    while (compressed.decisions.length > 0 && currentEst > maxContextTokens) {
      const lowestDec = sortedDecisions.shift();
      const removed = lowestDec
        ? compressed.decisions.find((d) => d.id === lowestDec.id)
        : compressed.decisions.pop();
      if (lowestDec) {
        compressed.decisions = compressed.decisions.filter((d) => d.id !== lowestDec.id);
      }
      if (removed) {
        const removedTokens = Math.ceil(JSON.stringify(removed).length / 4);
        currentEst = Math.max(0, currentEst - removedTokens);
      }
    }

    compressed.totalTokens = currentEst;
    return compressed;
  }
}
