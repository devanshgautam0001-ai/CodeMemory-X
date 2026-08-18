import { describe, it, expect } from 'vitest';
import { RenameMoveDetector } from '../extractors/RenameMoveDetector.js';

describe('RenameMoveDetector', () => {
  const detector = new RenameMoveDetector();

  it('detects RENAMED and MOVED statuses deterministically', () => {
    const events = [
      { id: 'e1', type: 'FILE_RENAMED', payload: { oldName: 'OldService', newName: 'NewService' } },
      { id: 'e2', type: 'FILE_MOVED', payload: { oldPath: 'src/old/app.ts' } },
    ];

    const res = detector.detectStatus(events, 'src/new/app.ts');
    expect(res.status).toBe('MOVED');
    expect(res.oldPaths).toContain('src/old/app.ts');
    expect(res.oldNames).toContain('OldService');
  });
});
