import { describe, it, expect } from 'vitest';
import { BirthExtractor } from '../extractors/BirthExtractor.js';

describe('BirthExtractor', () => {
  const extractor = new BirthExtractor();

  it('extracts symbol birth info from creation events', () => {
    const events = [
      { id: 'e1', type: 'FILE_OPEN', timestamp: '2026-08-09T10:00:00.000Z', payload: { filePath: 'src/auth.ts', author: 'Devan', comment: 'Added Auth' } },
    ];

    const birth = extractor.extractBirth('s1', 'AuthService', 'src/auth.ts', events);
    expect(birth.firstObservedAt).toBe('2026-08-09T10:00:00.000Z');
    expect(birth.author).toBe('Devan');
    expect(birth.rationaleCertainty).toBe('OBSERVED');
  });
});
