import { describe, it, expect } from 'vitest';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';

describe('ToolPermissionManager Unit Tests', () => {
  it('enforces ALLOW, DENY, and REQUIRE_CONFIRMATION policies', () => {
    const manager = new ToolPermissionManager({
      defaultPermission: 'DENY',
      toolPermissions: {
        safe_read: 'ALLOW',
        sensitive_action: 'REQUIRE_CONFIRMATION',
      },
    });

    const ctx = { requestId: 'r1', executionId: 'e1', toolCallId: 't1' };

    expect(manager.canExecute('safe_read', ctx)).toBe('ALLOW');
    expect(manager.canExecute('sensitive_action', ctx)).toBe('REQUIRE_CONFIRMATION');
    expect(manager.canExecute('unknown_tool', ctx)).toBe('DENY');
  });

  it('evaluates dynamic permission evaluator functions', () => {
    const manager = new ToolPermissionManager({
      evaluator: (name) => (name.startsWith('safe_') ? 'ALLOW' : 'DENY'),
    });

    const ctx = { requestId: 'r1', executionId: 'e1', toolCallId: 't1' };
    expect(manager.canExecute('safe_query', ctx)).toBe('ALLOW');
    expect(manager.canExecute('unsafe_exec', ctx)).toBe('DENY');
  });

  it('allows runtime update of permission policy via setPolicy', () => {
    const manager = new ToolPermissionManager({ defaultPermission: 'DENY' });
    const ctx = { requestId: 'r1', executionId: 'e1', toolCallId: 't1' };

    expect(manager.canExecute('my_tool', ctx)).toBe('DENY');
    manager.setPolicy({ defaultPermission: 'ALLOW' });
    expect(manager.canExecute('my_tool', ctx)).toBe('ALLOW');
  });
});
