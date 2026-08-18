import { ToolPermissionPolicy, ToolPermissionState } from '../types/ToolPermission.js';
import { ToolExecutionContext } from '../types/ToolExecutionContext.js';
import { ILogger } from '@codememory/logging';

export class ToolPermissionManager {
  private policy: ToolPermissionPolicy;

  constructor(policy?: ToolPermissionPolicy, private readonly logger?: ILogger) {
    this.policy = policy ?? { defaultPermission: 'ALLOW' };
  }

  public setPolicy(policy: ToolPermissionPolicy): void {
    this.policy = policy;
    this.logger?.info('[ToolPermissionManager] Updated tool permission policy');
  }

  public canExecute(toolName: string, context: ToolExecutionContext): ToolPermissionState {
    if (!toolName) return 'DENY';

    if (this.policy.evaluator) {
      try {
        return this.policy.evaluator(toolName, context);
      } catch (err: any) {
        this.logger?.error(`[ToolPermissionManager] Evaluator failed for '${toolName}': ${err.message}`);
        return 'DENY';
      }
    }

    if (this.policy.toolPermissions && toolName in this.policy.toolPermissions) {
      return this.policy.toolPermissions[toolName];
    }

    return this.policy.defaultPermission ?? 'DENY';
  }
}
