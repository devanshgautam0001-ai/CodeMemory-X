import { describe, it, expect } from 'vitest';
import { ToolValidator } from '../validation/ToolValidator.js';
import { ToolDefinition } from '../types/ToolTypes.js';

describe('ToolSchemaValidation Unit Tests', () => {
  it('passes valid tool definitions', () => {
    const tools: ToolDefinition[] = [
      {
        name: 'search_memory',
        description: 'Searches memory graph for symbols',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
          },
          required: ['query'],
        },
      },
    ];

    expect(() => ToolValidator.validateDefinitions(tools, 'test')).not.toThrow();
  });

  it('rejects tool missing a valid string name', () => {
    const invalidTools: any[] = [{ description: 'no name', parameters: {} }];
    expect(() => ToolValidator.validateDefinitions(invalidTools, 'test')).toThrow('name');
  });

  it('rejects duplicate tool names', () => {
    const dupTools: ToolDefinition[] = [
      { name: 'search', parameters: {} },
      { name: 'search', parameters: {} },
    ];
    expect(() => ToolValidator.validateDefinitions(dupTools, 'test')).toThrow('Duplicate tool name');
  });

  it('rejects invalid JSON schema parameters', () => {
    const invalidSchema: any[] = [{ name: 'test', parameters: 'not an object' }];
    expect(() => ToolValidator.validateDefinitions(invalidSchema, 'test')).toThrow('JSON Schema object');
  });

  it('rejects excessive tool count beyond MAX_TOOLS limit', () => {
    const excessiveTools: ToolDefinition[] = Array.from({ length: 65 }, (_, i) => ({
      name: `tool_${i}`,
      parameters: {},
    }));
    expect(() => ToolValidator.validateDefinitions(excessiveTools, 'test')).toThrow('maximum allowed tools count');
  });

  it('rejects oversized descriptions beyond MAX_DESCRIPTION_LENGTH limit', () => {
    const oversized: ToolDefinition[] = [
      {
        name: 'huge_desc',
        description: 'a'.repeat(4097),
        parameters: {},
      },
    ];
    expect(() => ToolValidator.validateDefinitions(oversized, 'test')).toThrow('exceeds maximum length');
  });
});
