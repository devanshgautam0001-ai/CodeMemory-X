import { describe, it, expect } from 'vitest';
import { IntentCaptureEngine } from '../engine/IntentCaptureEngine.js';

describe('IntentCaptureEngine (Deterministic Rule Extraction)', () => {
  const engine = new IntentCaptureEngine();

  it('extracts Bug Fix intent from FIXME comments', () => {
    const code = `
      // FIXME: Handle token expiration edge case
      function validate() {}
    `;
    const intents = engine.extractFromCode(code, 'auth/service.ts');
    expect(intents.length).toBe(1);
    expect(intents[0].type).toBe('Bug Fix');
    expect(intents[0].confidence).toBeGreaterThanOrEqual(0.9);
    expect(intents[0].affectedFiles).toContain('auth/service.ts');
  });

  it('extracts Temporary Workaround intent from HACK comments', () => {
    const code = `
      // HACK: Bypass rate limit for localhost testing
      const limit = 9999;
    `;
    const intents = engine.extractFromCode(code, 'config/rateLimit.ts');
    expect(intents.length).toBe(1);
    expect(intents[0].type).toBe('Temporary Workaround');
  });

  it('extracts Optimization intent from OPTIMIZE comments', () => {
    const code = `
      // OPTIMIZE: Cache heavy AST node traversal
      function traverse() {}
    `;
    const intents = engine.extractFromCode(code, 'parser/ast.ts');
    expect(intents.length).toBe(1);
    expect(intents[0].type).toBe('Optimization');
  });

  it('extracts Bug Fix intent from conventional commit messages', () => {
    const intent = engine.extractFromCommit('fix(auth): prevent null pointer on session timeout', ['auth.ts']);
    expect(intent).not.toBeNull();
    expect(intent?.type).toBe('Bug Fix');
    expect(intent?.affectedFiles).toContain('auth.ts');
  });

  it('extracts Refactor intent from file rename events', () => {
    const intent = engine.extractFromEvent('FILE_RENAMED', {
      oldFilePath: 'oldName.ts',
      filePath: 'newName.ts',
    });
    expect(intent).not.toBeNull();
    expect(intent?.type).toBe('Refactor');
    expect(intent?.affectedFiles).toContain('oldName.ts');
    expect(intent?.affectedFiles).toContain('newName.ts');
  });

  it('converts IntentObject to DeveloperIntentMemory model correctly', () => {
    const intent = engine.extractFromCommit('refactor: decouple event bus subscribers');
    expect(intent).not.toBeNull();
    if (intent) {
      const memory = engine.toMemoryModel(intent);
      expect(memory.type).toBe('intent');
      expect(memory.intentType).toBe('Refactor');
      expect(memory.importance).toBe(intent.confidence);
    }
  });
});
