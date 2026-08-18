import { describe, it, expect } from 'vitest';
import { SessionBoundaryDetector } from '../reconstruction/SessionBoundaryDetector.js';

describe('SessionBoundaryDetector', () => {
  const detector = new SessionBoundaryDetector(30 * 60 * 1000); // 30 minutes

  it('detects session boundary when inactivity exceeds threshold', () => {
    const t1 = '2026-08-09T10:00:00.000Z';
    const t2 = '2026-08-09T10:20:00.000Z';
    const t3 = '2026-08-09T10:55:00.000Z';

    expect(detector.isNewSession(t1, t2)).toBe(false);
    expect(detector.isNewSession(t2, t3)).toBe(true);
  });
});
