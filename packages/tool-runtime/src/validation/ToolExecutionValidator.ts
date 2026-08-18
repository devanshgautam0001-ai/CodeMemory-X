import { ToolCall } from '../types/ToolRuntimeTypes.js';
import { ToolExecutionError } from '../types/ToolExecutionError.js';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolValidator } from '@codememory/ai-provider';

export class ToolExecutionValidator {
  private static readonly MAX_ARG_SIZE = 256 * 1024; // 256KB

  public static validate(toolCall: ToolCall, registry: ToolRegistry): Record<string, unknown> {
    if (!toolCall || typeof toolCall !== 'object') {
      throw new ToolExecutionError({
        code: 'INVALID_ARGUMENTS',
        message: 'ToolCall must be a valid non-null object.',
      });
    }

    if (!toolCall.id || typeof toolCall.id !== 'string') {
      throw new ToolExecutionError({
        code: 'INVALID_ARGUMENTS',
        message: 'ToolCall is missing a required ID string.',
      });
    }

    if (!toolCall.name || typeof toolCall.name !== 'string') {
      throw new ToolExecutionError({
        code: 'INVALID_ARGUMENTS',
        message: 'ToolCall is missing a required name string.',
      });
    }

    const registeredTool = registry.resolve(toolCall.name);

    const parsedArgs = ToolValidator.parseArguments(
      toolCall.arguments,
      'tool-runtime',
      this.MAX_ARG_SIZE
    );

    this.checkPrototypePollution(parsedArgs, toolCall.name);

    return parsedArgs;
  }

  private static checkPrototypePollution(obj: unknown, toolName: string): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new ToolExecutionError({
          toolName,
          code: 'INVALID_ARGUMENTS',
          message: `Prototype pollution attempt detected in argument key '${key}'. Execution rejected.`,
        });
      }

      const val = (obj as any)[key];
      if (typeof val === 'object' && val !== null) {
        this.checkPrototypePollution(val, toolName);
      }
    }
  }
}
