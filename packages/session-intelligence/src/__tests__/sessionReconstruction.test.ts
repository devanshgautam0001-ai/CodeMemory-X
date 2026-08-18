import { describe, it, expect } from 'vitest';
import { SessionReconstructor } from '../reconstruction/SessionReconstructor.js';

describe('SessionReconstructor', () => {
  const reconstructor = new SessionReconstructor(30 * 60 * 1000);

  it('reconstructs session deterministically from historical event stream', () => {
    const events = [
      { id: 'e1', type: 'WORKSPACE_OPEN', timestamp: '2026-08-09T10:00:00.000Z', payload: { filePath: 'src/main.ts' } },
      { id: 'e2', type: 'FILE_MODIFIED', timestamp: '2026-08-09T10:05:00.000Z', payload: { filePath: 'src/main.ts' } },
      { id: 'e3', type: 'FILE_MODIFIED', timestamp: '2026-08-09T10:10:00.000Z', payload: { filePath: 'src/utils.ts' } },
    ];

    const sessions = reconstructor.reconstructFromEvents('test-ws', events);
    expect(sessions.length).toBe(1);
    expect(sessions[0].activeFiles.length).toBe(2);
    expect(sessions[0].startTime).toBe('2026-08-09T10:00:00.000Z');
  });
});
