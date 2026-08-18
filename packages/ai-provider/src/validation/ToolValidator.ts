import { ToolDefinition, ToolChoiceOption } from '../types/ToolTypes.js';
import { AIProviderError } from '../errors/AIProviderError.js';

export interface ToolValidationLimits {
  maxTools?: number;
  maxToolNameLength?: number;
  maxDescriptionLength?: number;
  maxArgumentSize?: number;
}

export class ToolValidator {
  private static readonly DEFAULT_MAX_TOOLS = 64;
  private static readonly DEFAULT_MAX_NAME_LENGTH = 128;
  private static readonly DEFAULT_MAX_DESC_LENGTH = 4096;
  private static readonly DEFAULT_MAX_ARG_SIZE = 256 * 1024; // 256KB
  private static readonly NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

  public static validateDefinitions(
    tools: ToolDefinition[],
    providerId: string,
    limits?: ToolValidationLimits
  ): void {
    const maxTools = limits?.maxTools ?? this.DEFAULT_MAX_TOOLS;
    const maxNameLen = limits?.maxToolNameLength ?? this.DEFAULT_MAX_NAME_LENGTH;
    const maxDescLen = limits?.maxDescriptionLength ?? this.DEFAULT_MAX_DESC_LENGTH;

    if (!Array.isArray(tools)) {
      throw new AIProviderError({
        providerId,
        code: 'INVALID_REQUEST',
        message: 'Tools field must be an array of ToolDefinition objects.',
      });
    }

    if (tools.length > maxTools) {
      throw new AIProviderError({
        providerId,
        code: 'INVALID_REQUEST',
        message: `Exceeded maximum allowed tools count (${tools.length} > ${maxTools}).`,
      });
    }

    const seenNames = new Set<string>();

    for (const tool of tools) {
      if (!tool.name || typeof tool.name !== 'string') {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_REQUEST',
          message: 'Tool definition missing required non-empty string name.',
        });
      }

      const trimmedName = tool.name.trim();
      if (!trimmedName || trimmedName.length > maxNameLen || !this.NAME_REGEX.test(trimmedName)) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_REQUEST',
          message: `Tool name '${tool.name}' is invalid. Must be alphanumeric/underscores/hyphens up to ${maxNameLen} characters.`,
        });
      }

      if (seenNames.has(trimmedName)) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_REQUEST',
          message: `Duplicate tool name detected: '${trimmedName}'. Tool names must be unique.`,
        });
      }
      seenNames.add(trimmedName);

      if (tool.description && typeof tool.description === 'string' && tool.description.length > maxDescLen) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_REQUEST',
          message: `Description for tool '${trimmedName}' exceeds maximum length of ${maxDescLen} characters.`,
        });
      }

      if (!tool.parameters || typeof tool.parameters !== 'object' || Array.isArray(tool.parameters)) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_REQUEST',
          message: `Parameters for tool '${trimmedName}' must be a valid JSON Schema object.`,
        });
      }
    }
  }

  public static validateChoice(
    choice: ToolChoiceOption,
    tools: ToolDefinition[],
    providerId: string
  ): void {
    if (typeof choice === 'string') {
      if (!['auto', 'none', 'required'].includes(choice)) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_REQUEST',
          message: `Invalid tool choice string option: '${choice}'. Must be 'auto', 'none', or 'required'.`,
        });
      }
      return;
    }

    if (typeof choice === 'object' && choice !== null && choice.type === 'function') {
      if (!choice.name || typeof choice.name !== 'string') {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_REQUEST',
          message: 'Specific tool choice must contain a valid tool function name.',
        });
      }
      const found = tools.some((t) => t.name === choice.name);
      if (!found) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_REQUEST',
          message: `Specific tool choice referenced unknown tool '${choice.name}'.`,
        });
      }
      return;
    }

    throw new AIProviderError({
      providerId,
      code: 'INVALID_REQUEST',
      message: 'Invalid toolChoice format.',
    });
  }

  public static parseArguments(
    rawArgs: unknown,
    providerId: string,
    maxSize = this.DEFAULT_MAX_ARG_SIZE
  ): Record<string, unknown> {
    if (typeof rawArgs === 'object' && rawArgs !== null && !Array.isArray(rawArgs)) {
      return rawArgs as Record<string, unknown>;
    }

    if (typeof rawArgs === 'string') {
      if (rawArgs.length > maxSize) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_RESPONSE',
          message: `Tool call arguments size (${rawArgs.length} bytes) exceeds safety limit (${maxSize} bytes).`,
        });
      }

      try {
        const parsed = JSON.parse(rawArgs);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
        return { value: parsed };
      } catch (err: any) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_RESPONSE',
          message: `Malformed JSON in tool call arguments: ${err.message}`,
          cause: err,
        });
      }
    }

    if (rawArgs === null || rawArgs === undefined) {
      return {};
    }

    return { value: rawArgs };
  }
}
