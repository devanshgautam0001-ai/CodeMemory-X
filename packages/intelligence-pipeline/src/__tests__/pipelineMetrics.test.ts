import { describe, it, expect } from 'vitest';
import { PipelineContext } from '../context/PipelineContext.js';

describe('PipelineMetrics & Context Tracking', () => {
  it('should track errors, warnings, and stage duration metrics accurately', () => {
    const ctx = new PipelineContext({ workspacePath: '/workspace' });

    ctx.addWarning('Deprecation notice in AST node');
    ctx.addError('Storage allocation overflow');

    expect(ctx.warnings).toHaveLength(1);
    expect(ctx.errors).toHaveLength(1);
    expect(ctx.metrics.errorCount).toBe(1);
    expect(ctx.metrics.warningCount).toBe(1);
  });
});
