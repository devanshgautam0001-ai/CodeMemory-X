import { ToolExecutionContext } from './ToolExecutionContext.js';

export type ToolPermissionState = 'ALLOW' | 'DENY' | 'REQUIRE_CONFIRMATION';

export interface ToolPermissionPolicy {
  defaultPermission?: ToolPermissionState;
  toolPermissions?: Record<string, ToolPermissionState>;
  evaluator?: (toolName: string, context: ToolExecutionContext) => ToolPermissionState;
}
