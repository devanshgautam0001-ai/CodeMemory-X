import { describe, it, expect } from 'vitest';
import { BirthExtractor } from '../extractors/BirthExtractor.js';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('Incomplete Evidence & UNKNOWN Semantics', () => {
  const extractor = new BirthExtractor();
  const engine = new SymbolStoryEngine();

  it('sets rationaleCertainty to UNKNOWN when no rationale exists in evidence', () => {
    const birth = extractor.extractBirth('s1', 'UserRepo', 'src/user.ts', []);
    expect(birth.rationale).toBeUndefined();
    expect(birth.rationaleCertainty).toBe('UNKNOWN');
  });

  it('reconstructs story with UNKNOWN rationale when evidence is incomplete', async () => {
    const story = await engine.rebuild('s1', 'UserRepo', 'src/user.ts');
    expect(story.birth?.rationaleCertainty).toBe('UNKNOWN');
    expect(story.birth?.rationale).toBeUndefined();
  });
});
