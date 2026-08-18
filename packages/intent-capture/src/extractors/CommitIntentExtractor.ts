import { IntentObject, SupportedIntentType } from '../types/IntentTypes.js';

export class CommitIntentExtractor {
  public extractFromCommit(commitMessage: string, affectedFiles: string[] = []): IntentObject | null {
    const trimmed = commitMessage.trim();
    if (!trimmed) return null;

    let type: SupportedIntentType = 'Feature';
    let confidence = 0.85;

    if (/^fix(\(.*\))?:/i.test(trimmed) || /fix|bug|issue|patch/i.test(trimmed)) {
      type = 'Bug Fix';
      confidence = 0.95;
    } else if (/^refactor(\(.*\))?:/i.test(trimmed) || /refactor|restructure|rename/i.test(trimmed)) {
      type = 'Refactor';
      confidence = 0.95;
    } else if (/^perf(\(.*\))?:/i.test(trimmed) || /optimize|speed|performance/i.test(trimmed)) {
      type = 'Optimization';
      confidence = 0.92;
    } else if (/^docs(\(.*\))?:/i.test(trimmed) || /readme|comment|documentation/i.test(trimmed)) {
      type = 'Documentation';
      confidence = 0.90;
    } else if (/^style(\(.*\))?:|^chore(\(.*\))?:/i.test(trimmed) || /clean|format|lint/i.test(trimmed)) {
      type = 'Cleanup';
      confidence = 0.88;
    } else if (/^arch(\(.*\))?:/i.test(trimmed) || /architecture|design|pattern/i.test(trimmed)) {
      type = 'Architecture';
      confidence = 0.90;
    } else if (/^test(\(.*\))?:/i.test(trimmed) || /spike|experiment|test/i.test(trimmed)) {
      type = 'Experiment';
      confidence = 0.85;
    } else if (/^feat(\(.*\))?:/i.test(trimmed) || /add|new|feature/i.test(trimmed)) {
      type = 'Feature';
      confidence = 0.92;
    }

    return {
      id: `intent_commit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      confidence,
      reason: `Commit message pattern matched: "${trimmed.split('\n')[0]}"`,
      affectedFiles,
      affectedSymbols: [],
      timestamp: new Date().toISOString(),
    };
  }
}
