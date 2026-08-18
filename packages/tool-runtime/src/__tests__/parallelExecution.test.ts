import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { ParallelToolExecutor } from '../execution/ParallelToolExecutor.js';

describe('ParallelToolExecutor Unit Tests', () => {
  it('executes tool calls in parallel respecting maxConcurrency and preserving original order', async () => {
    const registry = new ToolRegistry();
    let active = 0;
    let maxObservedActive = 0;

    registry.register({
      name: 'delay_tool',
      parameters: {},
      execute: async (args) => {
        active++;
        maxObservedActive = Math.max(maxObservedActive, active);
        await new Promise((r) => setTimeout(r, 20));
        active--;
        return { success: true, content: `item_${args.id}` };
      },
    });

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );
    const parExecutor = new ParallelToolExecutor(executor, 2);

    const calls = Array.from({ length: 5 }, (_, i) => ({
      id: `c_${i}`,
      name: 'delay_tool',
      arguments: { id: i },
    }));

    const res = await parExecutor.execute(calls);

    expect(maxObservedActive).toBeLessThanOrEqual(2);
    expect(res.toolResults).toHaveLength(5);
    expect(res.toolResults[0].content).toBe('item_0');
    expect(res.toolResults[4].content).toBe('item_4');
  });
});
