import { describe, it, expect } from 'vitest';
import { SystemPromptBuilder } from '../prompting/SystemPromptBuilder.js';

describe('SystemPromptBuilder Active Files Formatting Suite', () => {
  it('1. formats activeFiles cleanly when array elements are string primitives', () => {
    const builder = new SystemPromptBuilder();
    const prompt = builder.buildSystemPrompt({
      memories: [],
      symbolStory: null,
      sessionSummary: {
        sessionId: 'sess_01',
        state: 'ACTIVE',
        activeFiles: ['src/extension.ts', 'src/pipeline.ts'] as any,
      },
      decisions: [],
      driftFindings: [],
      totalTokens: 100,
    });

    expect(prompt).toContain('Active Files: src/extension.ts, src/pipeline.ts');
    expect(prompt).not.toContain(', , ');
  });

  it('2. formats activeFiles cleanly when array elements are objects with filePath', () => {
    const builder = new SystemPromptBuilder();
    const prompt = builder.buildSystemPrompt({
      memories: [],
      symbolStory: null,
      sessionSummary: {
        sessionId: 'sess_02',
        state: 'ACTIVE',
        activeFiles: [{ filePath: 'src/index.ts' }, { filePath: 'src/app.ts' }] as any,
      },
      decisions: [],
      driftFindings: [],
      totalTokens: 100,
    });

    expect(prompt).toContain('Active Files: src/index.ts, src/app.ts');
  });
});
