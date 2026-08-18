import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { SequentialToolExecutor } from '../execution/SequentialToolExecutor.js';

describe('SequentialToolExecutor Unit Tests', () => {
  it('executes tool calls sequentially preserving deterministic order', async () => {
    const registry = new ToolRegistry();
    const order: number[] = [];

    registry.register({
      name: 'tool_a',
      parameters: {},
      execute: async () => {
        order.push(1);
        return { success: true, content: 'a' };
      },
    });

    registry.register({
      name: 'tool_b',
      parameters: {},
      execute: async () => {
        order.push(2);
        return { success: true, content: 'b' };
      },
    });

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );
    const seqExecutor = new SequentialToolExecutor(executor);

    const res = await seqExecutor.execute([
      { id: 'c1', name: 'tool_a', arguments: {} },
      { id: 'c2', name: 'tool_b', arguments: {} },
    ]);

    expect(order).toEqual([1, 2]);
    expect(res.toolResults).toHaveLength(2);
    expect(res.toolResults[0].content).toBe('a');
    expect(res.toolResults[1].content).toBe('b');
  });

  it('stops sequential execution on error when continueOnError is false', async () => {
    const registry = new ToolRegistry();
    let executedB = false;

    registry.register({
      name: 'failing_tool',
      parameters: {},
      execute: async () => {
        throw new Error('Boom');
      },
    });

    registry.register({
      name: 'tool_b',
      parameters: {},
      execute: async () => {
        executedB = true;
        return { success: true, content: 'b' };
      },
    });

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );
    const seqExecutor = new SequentialToolExecutor(executor);

    const res = await seqExecutor.execute(
      [
        { id: 'c1', name: 'failing_tool', arguments: {} },
        { id: 'c2', name: 'tool_b', arguments: {} },
      ],
      undefined,
      false
    );

    expect(executedB).toBe(false);
    expect(res.toolResults).toHaveLength(1);
    expect(res.toolResults[0].isError).toBe(true);
  });
});
