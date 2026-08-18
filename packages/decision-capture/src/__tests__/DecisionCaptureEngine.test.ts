import { describe, it, expect } from 'vitest';
import { DecisionCaptureEngine } from '../engine/DecisionCaptureEngine.js';

describe('DecisionCaptureEngine (Deterministic Rule Extraction)', () => {
  const engine = new DecisionCaptureEngine();

  it('extracts architectural decision from ADR markdown files', () => {
    const markdown = `
      # ADR 004: Use SQLite WASM for Local EventStore Persistence

      ## Status
      Accepted

      ## Context
      We need local append-only event store persistence with zero external service dependencies.

      ## Decision
      We choose WASM SQLite (sql.js) embedded inside VS Code extension host.
    `;
    const decision = engine.extractFromAdr(markdown, 'docs/adr/004-sqlite-wasm.md');
    expect(decision).not.toBeNull();
    expect(decision?.title).toContain('SQLite WASM');
    expect(decision?.status).toBe('accepted');
    expect(decision?.confidence).toBe(1.0);
  });

  it('extracts decision from commit message matching conventional decision tags', () => {
    const decision = engine.extractFromCommit('adr: switch from REST to gRPC for IPC stream', ['ipc.ts']);
    expect(decision).not.toBeNull();
    expect(decision?.title).toBe('switch from REST to gRPC for IPC stream');
    expect(decision?.confidence).toBe(0.90);
  });

  it('extracts decision from dependency changes in package.json', () => {
    const decision = engine.extractFromEvent('DEPENDENCY_CHANGED', {
      filePath: 'package.json',
      addedDependencies: ['@codememory/decision-capture'],
      removedDependencies: [],
    });
    expect(decision).not.toBeNull();
    expect(decision?.title).toContain('Dependency Architecture Change');
    expect(decision?.confidence).toBe(0.95);
  });

  it('extracts decision from multi-file editing sessions', () => {
    const modifiedFiles = ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts', 'src/e.ts'];
    const decision = engine.extractFromEvent('EDIT_SESSION_COMPLETED', {}, modifiedFiles, 'sess_01');
    expect(decision).not.toBeNull();
    expect(decision?.title).toContain('Multi-Module Architectural Edit');
    expect(decision?.relatedFiles.length).toBe(5);
  });

  it('maps DecisionObject to DecisionMemory model correctly', () => {
    const decision = engine.extractFromCommit('adr: adopt hexagonal ports and adapters');
    expect(decision).not.toBeNull();
    if (decision) {
      const memory = engine.toMemoryModel(decision);
      expect(memory.type).toBe('decision');
      expect(memory.decisionTitle).toBe(decision.title);
      expect(memory.confidence).toBe(decision.confidence);
    }
  });
});
