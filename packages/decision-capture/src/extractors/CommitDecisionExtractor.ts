import { DecisionObject } from '../types/DecisionTypes.js';

export class CommitDecisionExtractor {
  public extractFromCommit(commitMessage: string, affectedFiles: string[] = []): DecisionObject | null {
    const trimmed = commitMessage.trim();
    if (!trimmed) return null;

    const isDecisionCommit =
      /^adr(\(.*\))?:|^decision(\(.*\))?:|^arch(\(.*\))?:|^break(\(.*\))?:/i.test(trimmed) ||
      /architectural decision|decision:|migrated to|deprecated/i.test(trimmed);

    if (!isDecisionCommit) return null;

    const firstLine = trimmed.split('\n')[0];
    const cleanTitle = firstLine.replace(/^(adr|decision|arch|break)(\(.*\))?:\s*/i, '');

    return {
      id: `dec_commit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: cleanTitle,
      description: trimmed,
      reason: `Architectural decision extracted from commit message: "${cleanTitle}"`,
      confidence: 0.90,
      timestamp: new Date().toISOString(),
      relatedSymbols: [],
      relatedFiles: affectedFiles,
      relatedIntents: [],
      relatedSessions: [],
      status: 'accepted',
      metadata: { source: 'commit-message' },
    };
  }
}
