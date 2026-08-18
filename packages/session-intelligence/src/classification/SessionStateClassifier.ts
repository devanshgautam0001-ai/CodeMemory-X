import { SessionState } from '../types/SessionTypes.js';
import { DeveloperSession } from '../types/DeveloperSession.js';
import { SessionEvidence } from '../types/SessionEvidence.js';

export class SessionStateClassifier {
  public classifyState(session: DeveloperSession): { state: SessionState; evidence: SessionEvidence[] } {
    const evidenceList: SessionEvidence[] = [];
    const now = new Date().toISOString();

    const fileCount = session.activeFiles.length;
    const totalEdits = session.activeFiles.reduce((sum, f) => sum + f.editCount, 0);

    const hasTestFile = session.activeFiles.some((f) => f.filePath.includes('.test.') || f.filePath.includes('.spec.'));
    const hasDocFile = session.activeFiles.some((f) => f.filePath.endsWith('.md') || f.filePath.includes('docs/'));
    const hasRefactorIntent = session.detectedIntents.some((i) => i.type.toLowerCase().includes('refactor'));
    const hasBugIntent = session.detectedIntents.some((i) => i.type.toLowerCase().includes('bug'));
    const hasOptIntent = session.detectedIntents.some((i) => i.type.toLowerCase().includes('optimization'));

    if (hasRefactorIntent || session.relatedRefactors.length > 0) {
      evidenceList.push({
        id: `ev_state_ref_${now}`,
        certainty: 'OBSERVED',
        source: 'intent-capture',
        description: 'Observed explicit refactor intent and symbol structural updates',
        observedAt: now,
        eventIds: [],
      });
      return { state: 'REFACTORING', evidence: evidenceList };
    }

    if (hasBugIntent || session.relatedBugs.length > 0) {
      evidenceList.push({
        id: `ev_state_bug_${now}`,
        certainty: 'OBSERVED',
        source: 'intent-capture',
        description: 'Observed bug fix intent or bug memory associations',
        observedAt: now,
        eventIds: [],
      });
      return { state: 'DEBUGGING', evidence: evidenceList };
    }

    if (hasOptIntent) {
      evidenceList.push({
        id: `ev_state_opt_${now}`,
        certainty: 'OBSERVED',
        source: 'intent-capture',
        description: 'Observed performance optimization intent',
        observedAt: now,
        eventIds: [],
      });
      return { state: 'OPTIMIZING', evidence: evidenceList };
    }

    if (hasTestFile) {
      evidenceList.push({
        id: `ev_state_test_${now}`,
        certainty: 'OBSERVED',
        source: 'workspace-watcher',
        description: 'Observed test file activity (.test / .spec)',
        observedAt: now,
        eventIds: [],
      });
      return { state: 'TESTING', evidence: evidenceList };
    }

    if (hasDocFile) {
      evidenceList.push({
        id: `ev_state_doc_${now}`,
        certainty: 'OBSERVED',
        source: 'workspace-watcher',
        description: 'Observed documentation file activity (.md / docs)',
        observedAt: now,
        eventIds: [],
      });
      return { state: 'DOCUMENTING', evidence: evidenceList };
    }

    if (totalEdits > 5) {
      evidenceList.push({
        id: `ev_state_impl_${now}`,
        certainty: 'INFERRED',
        source: 'session-intelligence',
        description: 'High modification count indicates active feature implementation',
        observedAt: now,
        eventIds: [],
      });
      return { state: 'IMPLEMENTING', evidence: evidenceList };
    }

    if (fileCount > 2 && totalEdits <= 3) {
      evidenceList.push({
        id: `ev_state_exp_${now}`,
        certainty: 'INFERRED',
        source: 'session-intelligence',
        description: 'Multiple files opened with low edit count indicates exploration/reading',
        observedAt: now,
        eventIds: [],
      });
      return { state: 'EXPLORING', evidence: evidenceList };
    }

    if (fileCount === 0) {
      return { state: 'UNKNOWN', evidence: [] };
    }

    evidenceList.push({
      id: `ev_state_mix_${now}`,
      certainty: 'INFERRED',
      source: 'session-intelligence',
      description: 'Multiple active signals produce a mixed session state',
      observedAt: now,
      eventIds: [],
    });
    return { state: 'MIXED', evidence: evidenceList };
  }
}
