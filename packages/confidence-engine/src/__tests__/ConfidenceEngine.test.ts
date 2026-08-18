import { describe, it, expect, beforeEach } from 'vitest';
import { ConfidenceEngine } from '../engine/ConfidenceEngine.js';
import { BaseMemory } from '@codememory/memory-engine';

describe('ConfidenceEngine (Deterministic Trust Score Engine)', () => {
  let engine: ConfidenceEngine;

  beforeEach(() => {
    engine = new ConfidenceEngine();
  });

  it('calculates deterministic confidence score for high-evidence payload', () => {
    const res = engine.calculateConfidence({
      entityId: 'mem_adr_001',
      entityType: 'Decision',
      sources: ['adr-markdown', 'git-engine'],
      timestamp: new Date().toISOString(),
      occurrenceCount: 5,
      sessionCount: 3,
      relationshipCount: 4,
      hasValidAst: true,
      hasLocationInfo: true,
      resolutionStatus: 'accepted',
      testStatus: 'passing',
    });

    expect(res.score).toBeGreaterThanOrEqual(0.90);
    expect(res.score).toBeLessThanOrEqual(1.0);
    expect(res.explanation.explanations.length).toBeGreaterThan(0);
  });

  it('calculates lower confidence score for isolated unverified payload', () => {
    const res = engine.calculateConfidence({
      entityId: 'mem_isolate',
      entityType: 'Bug',
      sources: ['workspace-watcher'],
      timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), // 31 days old
      occurrenceCount: 1,
      sessionCount: 1,
      relationshipCount: 0,
      hasValidAst: false,
      hasLocationInfo: false,
      resolutionStatus: 'open',
      testStatus: 'untested',
    });

    expect(res.score).toBeLessThan(0.65);
  });

  it('produces identical reproducible confidence score for identical evidence', () => {
    const evidence = {
      entityId: 'mem_test',
      entityType: 'Symbol',
      sources: ['tree-sitter-engine'],
      timestamp: '2026-08-01T12:00:00.000Z',
      occurrenceCount: 2,
      sessionCount: 1,
      relationshipCount: 2,
      hasValidAst: true,
      hasLocationInfo: true,
    };

    const res1 = engine.calculateConfidence(evidence);
    const res2 = engine.calculateConfidence(evidence);

    expect(res1.score).toBe(res2.score);
    expect(res1.explanation.factors).toEqual(res2.explanation.factors);
  });

  it('formats human-readable confidence explanation string', () => {
    const res = engine.calculateConfidence({
      entityId: 'mem_intent_1',
      entityType: 'Intent',
      sources: ['intent-capture-engine'],
      timestamp: new Date().toISOString(),
      occurrenceCount: 3,
      relationshipCount: 2,
      hasValidAst: true,
      hasLocationInfo: true,
    });

    const explanationStr = engine.explainConfidence(res);
    expect(explanationStr).toContain('Confidence Score:');
    expect(explanationStr).toContain('Source Reliability:');
    expect(explanationStr).toContain('Temporal Consistency:');
  });

  it('updates BaseMemory model with recalculated confidence score and metadata', () => {
    const memory: BaseMemory = {
      id: 'mem_01',
      type: 'file',
      summary: 'Memory for auth.service.ts',
      confidence: 0.5,
      importance: 0.8,
      recency: new Date().toISOString(),
      sourceEvents: ['evt_1', 'evt_2'],
      relationships: [{ targetMemoryId: 'mem_02', type: 'AFFECTS' }],
    };

    const updated = engine.updateMemoryConfidence(memory, {
      sources: ['git-engine', 'tree-sitter-engine'],
      hasValidAst: true,
      hasLocationInfo: true,
    });

    expect(updated.confidence).toBeGreaterThan(0.70);
    expect(updated.metadata?.confidenceExplanation).toBeDefined();
  });
});
