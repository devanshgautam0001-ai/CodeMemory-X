import { describe, it, expect } from 'vitest';
import { ToolExecutionValidator } from '../validation/ToolExecutionValidator.js';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { RegisteredTool } from '../types/ToolRuntimeTypes.js';

describe('ToolExecutionValidator Unit Tests', () => {
  it('validates tool arguments and prevents prototype pollution attempts', () => {
    const registry = new ToolRegistry();
    const tool: RegisteredTool = {
      name: 'valid_tool',
      parameters: { type: 'object' },
      execute: async () => ({ success: true, content: '' }),
    };
    registry.register(tool);

    const validCall = { id: 'call_1', name: 'valid_tool', arguments: { query: 'test' } };
    expect(() => ToolExecutionValidator.validate(validCall, registry)).not.toThrow();

    const pollutionCall = {
      id: 'call_2',
      name: 'valid_tool',
      arguments: JSON.parse('{"__proto__": {"polluted": true}}'),
    };
    expect(() => ToolExecutionValidator.validate(pollutionCall, registry)).toThrow(
      'Prototype pollution'
    );
  });

  it('rejects invalid JSON / non-existent tool names', () => {
    const registry = new ToolRegistry();
    const call = { id: 'call_3', name: 'missing_tool', arguments: {} };

    expect(() => ToolExecutionValidator.validate(call, registry)).toThrow('not registered');
  });

  it('rejects missing toolCall ID or missing tool name', () => {
    const registry = new ToolRegistry();
    const invalidIdCall = { id: '', name: 'valid_tool', arguments: {} } as any;
    const invalidNameCall = { id: 'c1', name: '', arguments: {} } as any;

    expect(() => ToolExecutionValidator.validate(invalidIdCall, registry)).toThrow('missing a required ID');
    expect(() => ToolExecutionValidator.validate(invalidNameCall, registry)).toThrow('missing a required name');
  });
});
