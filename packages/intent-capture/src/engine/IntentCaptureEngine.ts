import { ILogger } from '@codememory/logging';
import { DeveloperIntentMemory } from '@codememory/memory-engine';
import { IntentObject, IntentExtractionContext } from '../types/IntentTypes.js';
import { CommentIntentExtractor } from '../extractors/CommentIntentExtractor.js';
import { CommitIntentExtractor } from '../extractors/CommitIntentExtractor.js';
import { EventIntentExtractor } from '../extractors/EventIntentExtractor.js';

export class IntentCaptureEngine {
  private commentExtractor: CommentIntentExtractor;
  private commitExtractor: CommitIntentExtractor;
  private eventExtractor: EventIntentExtractor;

  constructor(private readonly logger?: ILogger) {
    this.commentExtractor = new CommentIntentExtractor();
    this.commitExtractor = new CommitIntentExtractor();
    this.eventExtractor = new EventIntentExtractor();
  }

  public extractFromCode(code: string, filePath: string): IntentObject[] {
    this.logger?.info('[IntentCaptureEngine] Extracting intents from source code comments', { filePath });
    return this.commentExtractor.extractFromCode(code, filePath);
  }

  public extractFromCommit(commitMessage: string, affectedFiles: string[] = []): IntentObject | null {
    this.logger?.info('[IntentCaptureEngine] Extracting intent from commit message', { commitMessage });
    return this.commitExtractor.extractFromCommit(commitMessage, affectedFiles);
  }

  public extractFromEvent(
    eventType: string,
    payload: Record<string, unknown>,
    editFrequency = 1
  ): IntentObject | null {
    this.logger?.info('[IntentCaptureEngine] Extracting intent from event', { eventType });
    return this.eventExtractor.extractFromEvent(eventType, payload, editFrequency);
  }

  public extractAll(context: IntentExtractionContext): IntentObject[] {
    const results: IntentObject[] = [];

    if (context.codeContent && context.filePath) {
      results.push(...this.extractFromCode(context.codeContent, context.filePath));
    }

    if (context.commitMessage) {
      const commitIntent = this.extractFromCommit(
        context.commitMessage,
        context.filePath ? [context.filePath] : []
      );
      if (commitIntent) results.push(commitIntent);
    }

    if (context.eventType && context.eventPayload) {
      const eventIntent = this.extractFromEvent(
        context.eventType,
        context.eventPayload,
        context.editFrequency
      );
      if (eventIntent) results.push(eventIntent);
    }

    return results;
  }

  public toMemoryModel(intent: IntentObject): DeveloperIntentMemory {
    return {
      id: intent.id,
      type: 'intent',
      intentType: intent.type,
      goal: intent.reason,
      activeFiles: intent.affectedFiles,
      summary: `Intent [${intent.type}]: ${intent.reason}`,
      importance: intent.confidence,
      confidence: intent.confidence,
      recency: intent.timestamp,
      sourceEvents: [intent.id],
      relationships: [],
    };
  }
}
