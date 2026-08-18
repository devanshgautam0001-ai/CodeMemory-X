import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRepository } from '@codememory/memory-engine';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { EventRecord } from '@codememory/event-store';
import { ContextEngine } from '../engine/ContextEngine.js';

describe('ContextEngine End-to-End Context Assembly', () => {
  let repository: MemoryRepository;
  let queryEngine: MemoryQueryEngine;
  let contextEngine: ContextEngine;

  beforeEach(() => {
    repository = new MemoryRepository();
    const events: EventRecord[] = [
      {
        id: 'e1',
        eventType: 'RECORD_DECISION',
        timestamp: '2026-08-07T14:00:00Z',
        correlationId: 'c1',
        source: 'vscode',
        workspace: '/workspace/project',
        payload: { title: 'Use ContextEngine Pipeline', rationale: 'Modular token optimization' },
        metadata: {},
      },
      {
        id: 'e2',
        eventType: 'FILE_MODIFIED',
        timestamp: '2026-08-07T14:10:00Z',
        correlationId: 'c1',
        source: 'watcher',
        workspace: '/workspace/project',
        payload: { file: '/workspace/project/src/index.ts' },
        metadata: {},
      },
    ];

    repository.buildMemory(events);
    queryEngine = new MemoryQueryEngine(repository);
    contextEngine = new ContextEngine(queryEngine);
  });

  it('should build AIContext package and PromptContext chunk', () => {
    const aiContext = contextEngine.buildContext({
      developerQuestion: 'How does ContextEngine format context?',
      selectedFile: '/workspace/project/src/index.ts',
      tokenBudget: 4096,
    });

    expect(aiContext.relevantMemories.length).toBeGreaterThan(0);
    expect(aiContext.formattedText).toContain('Question: How does ContextEngine format context?');
    expect(aiContext.estimatedTokens).toBeGreaterThan(0);

    const promptContext = contextEngine.createPromptContext({
      developerQuestion: 'How does ContextEngine format context?',
    });

    expect(promptContext.toSystemPromptChunk()).toContain('[CodeMemory X Context Package]');
  });
});
