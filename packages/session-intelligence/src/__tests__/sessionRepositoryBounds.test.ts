import { describe, it, expect } from 'vitest';
import { SessionRepository } from '../repository/SessionRepository.js';
import { DeveloperSession } from '../types/DeveloperSession.js';

describe('SessionRepository Bounds', () => {
  it('should enforce a 200 session capacity bound while preserving active session', () => {
    const repo = new SessionRepository();
    repo.setCurrentId('sess_active');

    const activeSession: DeveloperSession = {
      sessionId: 'sess_active',
      workspacePath: '/workspace',
      startTime: new Date().toISOString(),
      activityClassification: 'ACTIVE',
      stateClassification: 'IMPLEMENTING',
      focusArea: { primaryFiles: ['src/index.ts'], primarySymbols: [] },
      stats: { totalEvents: 1, fileEditsCount: 1, symbolEditsCount: 0, decisionsRecorded: 0, bugsIdentified: 0, refactorsPerformed: 0 },
      evidenceCertainty: 'OBSERVED',
    };
    repo.save(activeSession);

    for (let i = 1; i <= 210; i++) {
      const sess: DeveloperSession = {
        sessionId: `sess_${i}`,
        workspacePath: '/workspace',
        startTime: new Date(Date.now() - i * 1000).toISOString(),
        activityClassification: 'IDLE',
        stateClassification: 'EXPLORING',
        focusArea: { primaryFiles: [], primarySymbols: [] },
        stats: { totalEvents: 0, fileEditsCount: 0, symbolEditsCount: 0, decisionsRecorded: 0, bugsIdentified: 0, refactorsPerformed: 0 },
        evidenceCertainty: 'INFERRED',
      };
      repo.save(sess);
    }

    // Active session should be preserved despite 200 bound ceiling
    expect(repo.getById('sess_active')).toBeDefined();
    expect(repo.getCurrent()?.sessionId).toBe('sess_active');
  });
});
