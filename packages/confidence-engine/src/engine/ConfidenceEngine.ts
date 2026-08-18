import { ILogger } from '@codememory/logging';
import { BaseMemory } from '@codememory/memory-engine';
import {
  EvidencePayload,
  ConfidenceResult,
  FactorWeights,
} from '../types/ConfidenceTypes.js';
import { ConfidenceEvaluator } from '../evaluators/ConfidenceEvaluator.js';

export class ConfidenceEngine {
  private evaluator: ConfidenceEvaluator;

  constructor(private readonly logger?: ILogger) {
    this.evaluator = new ConfidenceEvaluator();
  }

  public calculateConfidence(
    evidence: EvidencePayload,
    customWeights?: Partial<FactorWeights>
  ): ConfidenceResult {
    this.logger?.info('[ConfidenceEngine] Calculating confidence for entity', {
      entityId: evidence.entityId,
      entityType: evidence.entityType,
    });
    return this.evaluator.evaluate(evidence, customWeights);
  }

  public explainConfidence(result: ConfidenceResult): string {
    const scorePct = (result.score * 100).toFixed(1);
    const header = `Confidence Score: ${scorePct}% (${result.score.toFixed(4)})\nBreakdown:\n`;
    const details = result.explanation.explanations.map((exp) => ` • ${exp}`).join('\n');
    return header + details;
  }

  public updateMemoryConfidence(
    memory: BaseMemory,
    evidencePayload?: Partial<EvidencePayload>
  ): BaseMemory {
    const evidence: EvidencePayload = {
      entityId: memory.id,
      entityType: memory.type,
      sources: memory.sourceEvents ?? ['memory-engine'],
      timestamp: memory.recency ?? new Date().toISOString(),
      occurrenceCount: (memory as any).editCount ?? 1,
      relationshipCount: memory.relationships?.length ?? 0,
      hasValidAst: true,
      hasLocationInfo: Boolean((memory as any).filePath),
      resolutionStatus: (memory as any).status ?? 'accepted',
      ...evidencePayload,
    };

    const res = this.calculateConfidence(evidence);

    return {
      ...memory,
      confidence: res.score,
      metadata: {
        ...(memory.metadata ?? {}),
        confidenceExplanation: res.explanation,
      },
    };
  }
}
