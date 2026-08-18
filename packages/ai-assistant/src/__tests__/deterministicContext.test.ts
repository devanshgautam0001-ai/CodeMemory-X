import { describe, it, expect } from 'vitest';
import { SystemPromptBuilder } from '../prompting/SystemPromptBuilder.js';

describe('DeterministicContext Unit Tests', () => {
  it('generates deterministic system prompts given identical input context', () => {
    const builder = new SystemPromptBuilder();
    const context = {
      memories: [{ summary: 'Fixed bug in parser' }],
      symbolStory: { symbolName: 'ParseTree' },
      sessionSummary: { sessionId: 'sess_1', state: 'ACTIVE' },
      decisions: [{ summary: 'Used Tree-sitter' }],
      driftFindings: [],
      totalTokens: 150,
    };

    const prompt1 = builder.buildSystemPrompt(context);
    const prompt2 = builder.buildSystemPrompt(context);

    expect(prompt1).toEqual(prompt2);
    expect(prompt1).toContain('ParseTree');
    expect(prompt1).toContain('Used Tree-sitter');
  });
});
