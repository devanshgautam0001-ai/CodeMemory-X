import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { RegisteredTool } from '../types/ToolRuntimeTypes.js';

describe('ToolRegistry Unit Tests', () => {
  it('registers tools deterministically with O(1) lookup', () => {
    const registry = new ToolRegistry();
    const tool: RegisteredTool = {
      name: 'search_memories',
      description: 'Search memories',
      parameters: { type: 'object' },
      execute: async () => ({ success: true, content: 'ok' }),
    };

    registry.register(tool);
    expect(registry.has('search_memories')).toBe(true);
    expect(registry.get('SEARCH_MEMORIES')).toBeDefined();
    expect(registry.list()).toHaveLength(1);
    expect(registry.getDefinitions()).toHaveLength(1);
  });

  it('rejects duplicate tool registrations', () => {
    const registry = new ToolRegistry();
    const tool: RegisteredTool = {
      name: 'duplicate_tool',
      parameters: {},
      execute: async () => ({ success: true, content: '' }),
    };

    registry.register(tool);
    expect(() => registry.register(tool)).toThrow('Duplicate tool registration');
  });

  it('unregisters tools cleanly', () => {
    const registry = new ToolRegistry();
    const tool: RegisteredTool = {
      name: 'temp_tool',
      parameters: {},
      execute: async () => ({ success: true, content: '' }),
    };

    registry.register(tool);
    expect(registry.unregister('temp_tool')).toBe(true);
    expect(registry.has('temp_tool')).toBe(false);
  });

  it('clears registry and resolves missing tool with TOOL_NOT_FOUND error', () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'clear_me',
      parameters: {},
      execute: async () => ({ success: true, content: '' }),
    });

    registry.clear();
    expect(registry.list()).toHaveLength(0);
    expect(() => registry.resolve('clear_me')).toThrow('TOOL_NOT_FOUND');
  });

  it('rejects registration of invalid tool objects or missing execute functions', () => {
    const registry = new ToolRegistry();
    expect(() => registry.register(null as any)).toThrow('Invalid tool object');
    expect(() => registry.register({ name: 'no_exec', parameters: {} } as any)).toThrow('missing execute function');
  });
});
