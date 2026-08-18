import { AssistantRequest } from '../types/AssistantRequest.js';
import { AssistantMessage } from '../types/AssistantTypes.js';

export type ContextPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ScoredContextItem<T = any> {
  item: T;
  score: number;
  priority: ContextPriority;
  signals: string[];
}

export class ContextRanker {
  public static getPriorityWeight(p: ContextPriority): number {
    switch (p) {
      case 'CRITICAL':
        return 4;
      case 'HIGH':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'LOW':
        return 1;
    }
  }

  public static rankItems<
    T extends {
      id?: string;
      title?: string;
      content?: string;
      filePath?: string;
      symbolName?: string;
      confidence?: number;
      timestamp?: string;
      createdAt?: string;
      updatedAt?: string;
      severity?: string;
      riskScore?: number;
      sessionId?: string;
      relationships?: any[];
      impactedFiles?: string[];
      affectedSymbols?: string[];
      type?: string;
    }
  >(
    items: T[],
    request: AssistantRequest,
    conversationHistory?: AssistantMessage[]
  ): { rankedItems: T[]; itemScores: Record<string, { score: number; priority: ContextPriority; signals: string[] }> } {
    if (!items || items.length === 0) {
      return { rankedItems: [], itemScores: {} };
    }

    const promptLower = request.prompt.toLowerCase();
    const historyText = conversationHistory?.map((m) => m.content.toLowerCase()).join(' ') ?? '';
    const combinedText = `${promptLower} ${historyText}`;
    const itemScores: Record<string, { score: number; priority: ContextPriority; signals: string[] }> = {};

    const scored = items.map((item) => {
      let score = 0;
      const signals: string[] = [];

      // 1. Active Symbol Match (+4.0)
      const symbolMatch = Boolean(
        request.activeSymbolName &&
          (item.symbolName?.toLowerCase() === request.activeSymbolName.toLowerCase() ||
            item.title?.toLowerCase().includes(request.activeSymbolName.toLowerCase()) ||
            item.content?.toLowerCase().includes(request.activeSymbolName.toLowerCase()) ||
            item.affectedSymbols?.some((s) => s.toLowerCase() === request.activeSymbolName?.toLowerCase()))
      );
      if (symbolMatch) {
        score += 4.0;
        signals.push('Active Symbol Match');
      }

      // 2. Active File Match (+3.0)
      const fileMatch = Boolean(
        request.activeFilePath &&
          (item.filePath?.toLowerCase() === request.activeFilePath.toLowerCase() ||
            item.content?.toLowerCase().includes(request.activeFilePath.toLowerCase()) ||
            item.impactedFiles?.some((f) => f.toLowerCase() === request.activeFilePath?.toLowerCase()))
      );
      if (fileMatch) {
        score += 3.0;
        signals.push('Active File Match');
      }

      // 3. Conversation Reference (+2.5)
      const conversationRef = Boolean(
        (item.symbolName && combinedText.includes(item.symbolName.toLowerCase())) ||
          (item.title && combinedText.includes(item.title.toLowerCase()))
      );
      if (conversationRef) {
        score += 2.5;
        signals.push('Conversation Reference');
      }

      // 4. Current Session Association (+2.0)
      const currentSession = Boolean(
        item.sessionId || item.type === 'session' || (item.title && item.title.toLowerCase().includes('session'))
      );
      if (currentSession) {
        score += 2.0;
        signals.push('Session Association');
      }

      // 5. Memory Relationship Strength (+1.5)
      const memoryRelationship = Boolean(item.relationships && item.relationships.length > 0);
      if (memoryRelationship) {
        score += 1.5;
        signals.push('Memory Relationship');
      }

      // 6. Decision Relationship (+2.0)
      const decisionRelationship = Boolean(
        item.type === 'decision' || (item.title && (item.title.toLowerCase().includes('adr') || item.title.toLowerCase().includes('decision')))
      );
      if (decisionRelationship) {
        score += 2.0;
        signals.push('Decision Relationship');
      }

      // 7. Architectural Risk (+2.5)
      const architecturalRisk = Boolean(
        (item.severity && (item.severity === 'high' || item.severity === 'critical')) ||
          (item.riskScore && item.riskScore > 0.6) ||
          item.type === 'drift'
      );
      if (architecturalRisk) {
        score += 2.5;
        signals.push('Architectural Risk');
      }

      // 8. Change Impact (+2.0)
      const changeImpact = Boolean(
        item.type === 'impact' || (item.impactedFiles && item.impactedFiles.length > 0)
      );
      if (changeImpact) {
        score += 2.0;
        signals.push('Change Blast Radius');
      }

      // 9. Recency Bonus (+1.0)
      const itemTime = item.updatedAt ?? item.createdAt ?? item.timestamp;
      let recencyTime = 0;
      if (itemTime) {
        recencyTime = new Date(itemTime).getTime();
        if (isNaN(recencyTime)) {
          recencyTime = 0;
        } else {
          const ageMs = Date.now() - recencyTime;
          if (ageMs < 24 * 60 * 60 * 1000) {
            score += 1.0;
            signals.push('Recent (<24h)');
          }
        }
      }

      // 10. Confidence (+1.0 * confidence)
      const confidence = item.confidence ?? 0.8;
      score += confidence * 1.0;
      signals.push(`Confidence (${(confidence * 100).toFixed(0)}%)`);

      // Determine Priority Bucket
      let priority: ContextPriority = 'LOW';
      if (architecturalRisk || (symbolMatch && score >= 4.0)) {
        priority = 'CRITICAL';
      } else if (fileMatch || decisionRelationship || changeImpact) {
        priority = 'HIGH';
      } else if (currentSession || memoryRelationship || conversationRef) {
        priority = 'MEDIUM';
      }

      const itemId = item.id ?? `item_${Math.random().toString(36).substring(2, 7)}`;
      itemScores[itemId] = {
        score: Number(score.toFixed(2)),
        priority,
        signals,
      };

      return {
        item,
        score,
        priority,
        confidence,
        recencyTime,
      };
    });

    // Multi-level deterministic sorting comparator:
    // 1. priorityWeight DESC
    // 2. score DESC
    // 3. confidence DESC
    // 4. recencyTime DESC
    // 5. stable ID ASC
    scored.sort((a, b) => {
      const pWeightA = ContextRanker.getPriorityWeight(a.priority);
      const pWeightB = ContextRanker.getPriorityWeight(b.priority);
      if (pWeightB !== pWeightA) return pWeightB - pWeightA;

      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;

      const confDiff = b.confidence - a.confidence;
      if (Math.abs(confDiff) > 0.001) return confDiff;

      const timeDiff = b.recencyTime - a.recencyTime;
      if (timeDiff !== 0) return timeDiff;

      const idA = a.item.id ?? '';
      const idB = b.item.id ?? '';
      return idA.localeCompare(idB);
    });

    return {
      rankedItems: scored.map((s) => s.item),
      itemScores,
    };
  }
}
