import { describe, it, expect } from 'vitest';
import { MilestoneExtractor } from '../extractors/MilestoneExtractor.js';

describe('MilestoneExtractor', () => {
  const extractor = new MilestoneExtractor();

  it('extracts and sorts milestones chronologically with ID tie-breaking', () => {
    const events = [
      { id: 'b_evt', type: 'FILE_MODIFIED', timestamp: '2026-08-09T10:00:00.000Z', payload: { filePath: 'src/app.ts' } },
      { id: 'a_evt', type: 'FILE_MODIFIED', timestamp: '2026-08-09T10:00:00.000Z', payload: { filePath: 'src/app.ts' } },
      { id: 'c_evt', type: 'FILE_OPEN', timestamp: '2026-08-09T09:00:00.000Z', payload: { filePath: 'src/app.ts' } },
    ];

    const milestones = extractor.extractMilestones('sym1', 'src/app.ts', events);
    expect(milestones.length).toBe(3);
    expect(milestones[0].type).toBe('ADDED');
    expect(milestones[1].id).toBe('ms_a_evt');
  });
});
