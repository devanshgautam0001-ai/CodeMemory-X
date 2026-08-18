import { describe, it, expect } from 'vitest';
import { ContextCompressor } from '../compressor/ContextCompressor.js';
import { FileMemory, SessionMemory } from '@codememory/memory-engine';

describe('ContextCompressor Deduplication & Summarization', () => {
  it('should summarize repeated file edit entries and collapse sessions', () => {
    const compressor = new ContextCompressor();

    const f1: FileMemory = {
      id: 'f1',
      type: 'file',
      filePath: '/src/main.ts',
      editCount: 3,
      authors: ['alice'],
      lastModifiedAt: '2026-08-07T10:00:00Z',
      summary: 'Main file',
      confidence: 0.9,
      importance: 0.7,
      recency: '2026-08-07T10:00:00Z',
      sourceEvents: ['e1'],
      relationships: [],
    };

    const f2: FileMemory = {
      id: 'f2',
      type: 'file',
      filePath: '/src/main.ts',
      editCount: 2,
      authors: ['bob'],
      lastModifiedAt: '2026-08-07T11:00:00Z',
      summary: 'Main file edit',
      confidence: 0.9,
      importance: 0.7,
      recency: '2026-08-07T11:00:00Z',
      sourceEvents: ['e2'],
      relationships: [],
    };

    const summarized = compressor.summarizeFileEdits([f1, f2]);
    expect(summarized).toHaveLength(1);
    expect(summarized[0].editCount).toBe(5);
    expect(summarized[0].authors).toContain('alice');
    expect(summarized[0].authors).toContain('bob');

    const s1: SessionMemory = {
      id: 's1',
      type: 'session',
      sessionId: 'sess-1',
      startTime: '2026-08-07T09:00:00Z',
      modifiedFilesCount: 2,
      summary: 'Session 1',
      confidence: 1.0,
      importance: 0.5,
      recency: '2026-08-07T10:00:00Z',
      sourceEvents: ['se1'],
      relationships: [],
    };

    const s2: SessionMemory = {
      id: 's2',
      type: 'session',
      sessionId: 'sess-2',
      startTime: '2026-08-07T10:00:00Z',
      modifiedFilesCount: 3,
      summary: 'Session 2',
      confidence: 1.0,
      importance: 0.5,
      recency: '2026-08-07T11:00:00Z',
      sourceEvents: ['se2'],
      relationships: [],
    };

    const collapsed = compressor.collapseSessions([s1, s2]);
    expect(collapsed).toBeDefined();
    expect(collapsed?.modifiedFilesCount).toBe(5);
  });
});
