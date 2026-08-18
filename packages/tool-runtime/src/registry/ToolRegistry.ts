import { RegisteredTool, ToolDefinition } from '../types/ToolRuntimeTypes.js';
import { ToolExecutionError } from '../types/ToolExecutionError.js';
import { ToolValidator } from '@codememory/ai-provider';
import { ILogger } from '@codememory/logging';

export class ToolRegistry {
  private tools = new Map<string, RegisteredTool>();

  constructor(private readonly logger?: ILogger) {}

  public register(tool: RegisteredTool): void {
    if (!tool || typeof tool !== 'object') {
      throw new ToolExecutionError({
        code: 'INVALID_ARGUMENTS',
        message: 'Invalid tool object provided to registry.',
      });
    }

    if (!tool.name || typeof tool.name !== 'string') {
      throw new ToolExecutionError({
        code: 'INVALID_ARGUMENTS',
        message: 'Tool registration failed: missing tool name.',
      });
    }

    if (typeof tool.execute !== 'function') {
      throw new ToolExecutionError({
        toolName: tool.name,
        code: 'INVALID_ARGUMENTS',
        message: `Tool registration failed for '${tool.name}': missing execute function.`,
      });
    }

    // Validate definition using ToolValidator
    ToolValidator.validateDefinitions(
      [{ name: tool.name, description: tool.description, parameters: tool.parameters }],
      'tool-runtime'
    );

    const nameKey = tool.name.trim().toLowerCase();
    if (this.tools.has(nameKey)) {
      throw new ToolExecutionError({
        toolName: tool.name,
        code: 'INVALID_ARGUMENTS',
        message: `Duplicate tool registration rejected for name: '${tool.name}'.`,
      });
    }

    this.tools.set(nameKey, tool);
    this.logger?.info(`[ToolRegistry] Registered tool: ${tool.name}`);
  }

  public unregister(name: string): boolean {
    if (!name) return false;
    const nameKey = name.trim().toLowerCase();
    const removed = this.tools.delete(nameKey);
    if (removed) {
      this.logger?.info(`[ToolRegistry] Unregistered tool: ${name}`);
    }
    return removed;
  }

  public get(name: string): RegisteredTool | undefined {
    if (!name) return undefined;
    return this.tools.get(name.trim().toLowerCase());
  }

  public has(name: string): boolean {
    if (!name) return false;
    return this.tools.has(name.trim().toLowerCase());
  }

  public list(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  public clear(): void {
    this.tools.clear();
    this.logger?.info('[ToolRegistry] Cleared all registered tools');
  }

  public getDefinitions(): ToolDefinition[] {
    return this.list().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  public resolve(name: string): RegisteredTool {
    const tool = this.get(name);
    if (!tool) {
      throw new ToolExecutionError({
        toolName: name,
        code: 'TOOL_NOT_FOUND',
        message: `Tool '${name}' is not registered in the ToolRegistry.`,
      });
    }
    return tool;
  }
}
