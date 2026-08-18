import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { ToolValidator } from '../validation/ToolValidator.js';
import { ToolDefinition } from '../types/ToolTypes.js';

describe('ToolChoice Unit Tests', () => {
  it('validates auto, none, required, and specific tool function selection', () => {
    const tools: ToolDefinition[] = [{ name: 'my_tool', parameters: {} }];

    expect(() => ToolValidator.validateChoice('auto', tools, 'test')).not.toThrow();
    expect(() => ToolValidator.validateChoice('none', tools, 'test')).not.toThrow();
    expect(() => ToolValidator.validateChoice('required', tools, 'test')).not.toThrow();
    expect(() =>
      ToolValidator.validateChoice({ type: 'function', name: 'my_tool' }, tools, 'test')
    ).not.toThrow();
  });

  it('rejects specific tool choice pointing to an unknown tool name with INVALID_REQUEST', () => {
    const tools: ToolDefinition[] = [{ name: 'my_tool', parameters: {} }];

    expect(() =>
      ToolValidator.validateChoice({ type: 'function', name: 'non_existent' }, tools, 'test')
    ).toThrow('referenced unknown tool');
  });
});
