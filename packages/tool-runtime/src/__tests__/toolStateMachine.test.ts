import { describe, it, expect } from 'vitest';
import { ToolCallStateMachine } from '../orchestration/ToolCallStateMachine.js';

describe('ToolCallStateMachine Unit Tests', () => {
  it('manages valid lifecycle state transitions deterministically', () => {
    const sm = new ToolCallStateMachine('req_test_1');
    expect(sm.getState()).toBe('IDLE');

    sm.transitionTo('REQUESTING');
    expect(sm.getState()).toBe('REQUESTING');

    sm.transitionTo('TOOL_CALL_RECEIVED');
    expect(sm.getState()).toBe('TOOL_CALL_RECEIVED');

    sm.transitionTo('PERMISSION_CHECK');
    expect(sm.getState()).toBe('PERMISSION_CHECK');

    sm.transitionTo('EXECUTING');
    expect(sm.getState()).toBe('EXECUTING');

    sm.transitionTo('TOOL_RESULT');
    expect(sm.getState()).toBe('TOOL_RESULT');

    sm.transitionTo('FOLLOWUP_REQUEST');
    expect(sm.getState()).toBe('FOLLOWUP_REQUEST');

    sm.transitionTo('STREAMING');
    expect(sm.getState()).toBe('STREAMING');

    sm.transitionTo('COMPLETED');
    expect(sm.getState()).toBe('COMPLETED');

    const history = sm.getHistory();
    expect(history.length).toBe(9);
  });

  it('rejects invalid state transitions', () => {
    const sm = new ToolCallStateMachine('req_test_2');
    expect(() => sm.transitionTo('EXECUTING')).toThrow();
  });
});
