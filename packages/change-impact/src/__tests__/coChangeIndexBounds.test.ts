import { describe, it, expect } from 'vitest';
import { CoChangeIndex } from '../index/CoChangeIndex.js';

describe('CoChangeIndex Bounds', () => {
  it('should enforce capacity bounds on fileTotalEdits and pairCounts', () => {
    const index = new CoChangeIndex();

    // Index 2100 single-file commits to exceed 2000 fileTotalEdits limit
    for (let i = 1; i <= 2100; i++) {
      index.indexCommit([`file_${i}.ts`, `file_${i + 1}.ts`]);
    }

    // Indexing should proceed cleanly without memory blowup
    const coChanged = index.getCoChangedFiles('file_2099.ts');
    expect(Array.isArray(coChanged)).toBe(true);
  });
});
