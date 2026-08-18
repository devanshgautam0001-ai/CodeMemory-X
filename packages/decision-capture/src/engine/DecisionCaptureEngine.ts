import { ILogger } from '@codememory/logging';
import { DecisionMemory } from '@codememory/memory-engine';
import { DecisionObject, DecisionExtractionContext } from '../types/DecisionTypes.js';
import { AdrDecisionExtractor } from '../extractors/AdrDecisionExtractor.js';
import { CommitDecisionExtractor } from '../extractors/CommitDecisionExtractor.js';
import { GraphDecisionExtractor } from '../extractors/GraphDecisionExtractor.js';

export class DecisionCaptureEngine {
  private adrExtractor: AdrDecisionExtractor;
  private commitExtractor: CommitDecisionExtractor;
  private graphExtractor: GraphDecisionExtractor;

  constructor(private readonly logger?: ILogger) {
    this.adrExtractor = new AdrDecisionExtractor();
    this.commitExtractor = new CommitDecisionExtractor();
    this.graphExtractor = new GraphDecisionExtractor();
  }

  public extractFromAdr(content: string, filePath: string): DecisionObject | null {
    this.logger?.info('[DecisionCaptureEngine] Extracting decision from ADR file', { filePath });
    return this.adrExtractor.extractFromAdrFile(content, filePath);
  }

  public extractFromCommit(commitMessage: string, affectedFiles: string[] = []): DecisionObject | null {
    this.logger?.info('[DecisionCaptureEngine] Extracting decision from commit message', { commitMessage });
    return this.commitExtractor.extractFromCommit(commitMessage, affectedFiles);
  }

  public extractFromEvent(
    eventType: string,
    payload: Record<string, unknown>,
    modifiedFiles: string[] = [],
    sessionId?: string
  ): DecisionObject | null {
    this.logger?.info('[DecisionCaptureEngine] Extracting decision from event', { eventType });
    return this.graphExtractor.extractFromEvent(eventType, payload, modifiedFiles, sessionId);
  }

  public extractAll(context: DecisionExtractionContext): DecisionObject[] {
    const results: DecisionObject[] = [];

    if (context.fileContent && context.filePath) {
      const adrDec = this.extractFromAdr(context.fileContent, context.filePath);
      if (adrDec) results.push(adrDec);
    }

    if (context.commitMessage) {
      const commitDec = this.extractFromCommit(
        context.commitMessage,
        context.modifiedFiles ?? (context.filePath ? [context.filePath] : [])
      );
      if (commitDec) results.push(commitDec);
    }

    if (context.eventType && context.eventPayload) {
      const graphDec = this.extractFromEvent(
        context.eventType,
        context.eventPayload,
        context.modifiedFiles ?? [],
        context.sessionId
      );
      if (graphDec) results.push(graphDec);
    }

    return results;
  }

  public recordDecision(title: string, reason: string, affectedFiles: string[] = []): DecisionObject {
    return {
      id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      description: reason,
      reason,
      confidence: 0.95,
      timestamp: new Date().toISOString(),
      relatedSymbols: [],
      relatedFiles: affectedFiles,
      relatedIntents: [],
      relatedSessions: [],
    };
  }

  public toMemoryModel(decision: DecisionObject): DecisionMemory {
    return {
      id: decision.id,
      type: 'decision',
      decisionTitle: decision.title,
      rationale: decision.reason,
      author: 'ExtensionHost',
      boundSymbols: decision.relatedSymbols,
      summary: `ADR: ${decision.title} (${decision.description.substring(0, 100)})`,
      confidence: decision.confidence,
      importance: decision.confidence,
      recency: decision.timestamp,
      sourceEvents: [decision.id],
      relationships: decision.relatedFiles.map((file) => ({
        targetMemoryId: `mem_file_${file}`,
        type: 'BOUND_TO',
      })),
      metadata: decision.metadata,
    };
  }
}
