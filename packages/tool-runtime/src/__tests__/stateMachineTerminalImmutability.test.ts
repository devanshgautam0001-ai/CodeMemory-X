import { describe, it, expect } from 'vitest';
import { ToolCallStateMachine } from '../orchestration/ToolCallStateMachine.js';

describe('ToolCallStateMachine Terminal Immutability Suite', () => {
  it('1. throws when attempting transition out of COMPLETED state', () => {
    const sm = new ToolCallStateMachine('req_01');
    sm.transitionTo('REQUESTING');
    sm.transitionTo('COMPLETED');

    expect(() => sm.transitionTo('IDLE')).toThrow('Invalid state transition');
    expect(sm.getState()).toBe('COMPLETED');
  });

  it('2. throws when attempting transition out of FAILED or DENIED state', () => {
    const smFailed = new ToolCallStateMachine('req_02');
    smFailed.transitionTo('FAILED');
    expect(() => smFailed.transitionTo('IDLE')).toThrow('Invalid state transition');
    expect(smFailed.getState()).toBe('FAILED');

    const smDenied = new ToolCallStateMachine('req_03');
    smDenied.transitionTo('REQUESTING');
    smDenied.transitionTo('TOOL_CALL_RECEIVED');
    smDenied.transitionTo('PERMISSION_CHECK');
    smDenied.transitionTo('DENIED');
    expect(() => smDenied.transitionTo('IDLE')).toThrow('Invalid state transition');
    expect(smDenied.getState()).toBe('DENIED');
  });
});
