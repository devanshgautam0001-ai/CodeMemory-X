import { describe, it, expect } from 'vitest';
import { SystemPromptBuilder } from '../prompting/SystemPromptBuilder.js';

describe('SystemPromptBuilder Unit Tests', () => {
  it('formats system prompt with Markdown context sections', () => {
    const builder = new SystemPromptBuilder('Custom Prefix:');
    const prompt = builder.buildSystemPrompt({
      memories: [{ summary: 'Did X' }],
      decisions: [{ summary: 'ADR-1 Rationale' }],
      driftFindings: [{ severity: 'HIGH', description: 'Cycle detected' }],
      totalTokens: 100,
    });

    expect(prompt).toContain('Custom Prefix:');
    expect(prompt).toContain('Architectural Decision Records');
    expect(prompt).toContain('ADR-1 Rationale');
    expect(prompt).toContain('Architectural Drift Sentinel Warnings');
  });

  it('formats default system prompt prefix and session context', () => {
    const builder = new SystemPromptBuilder();
    const prompt = builder.buildSystemPrompt({
      memories: [],
      sessionSummary: { sessionId: 's100', state: 'ACTIVE', activeFiles: [{ filePath: 'src/index.ts' }] },
      symbolStory: { symbolName: 'MyFunc', birth: { commitHash: 'abc123' }, milestones: [1, 2] },
      changeImpact: { impactScore: 0.9 },
      driftFindings: [],
      decisions: [],
      totalTokens: 200,
    });

    expect(prompt).toContain('CodeMemory X AI Assistant');
    expect(prompt).toContain('Session ID: s100');
    expect(prompt).toContain('Symbol Name: MyFunc');
    expect(prompt).toContain('Impact Score: 0.9');
  });
});
