export type ToolCallState =
  | 'IDLE'
  | 'REQUESTING'
  | 'TOOL_CALL_RECEIVED'
  | 'PERMISSION_CHECK'
  | 'EXECUTING'
  | 'TOOL_RESULT'
  | 'FOLLOWUP_REQUEST'
  | 'STREAMING'
  | 'COMPLETED'
  | 'FAILED'
  | 'DENIED';

export class ToolCallStateMachine {
  private currentState: ToolCallState = 'IDLE';
  private history: { state: ToolCallState; timestamp: string; details?: string }[] = [];

  constructor(public readonly requestId: string) {
    this.recordState('IDLE');
  }

  public getState(): ToolCallState {
    return this.currentState;
  }

  public transitionTo(nextState: ToolCallState, details?: string): void {
    if (!this.isValidTransition(this.currentState, nextState)) {
      throw new Error(
        `[ToolCallStateMachine] Invalid state transition from '${this.currentState}' to '${nextState}' for request ${this.requestId}`
      );
    }
    this.currentState = nextState;
    this.recordState(nextState, details);
  }

  private recordState(state: ToolCallState, details?: string): void {
    this.history.push({
      state,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  public getHistory() {
    return [...this.history];
  }

  private isValidTransition(from: ToolCallState, to: ToolCallState): boolean {
    if (from === to) return true;
    switch (from) {
      case 'IDLE':
        return to === 'REQUESTING' || to === 'FAILED';
      case 'REQUESTING':
        return to === 'TOOL_CALL_RECEIVED' || to === 'STREAMING' || to === 'COMPLETED' || to === 'FAILED';
      case 'TOOL_CALL_RECEIVED':
        return to === 'PERMISSION_CHECK' || to === 'FAILED';
      case 'PERMISSION_CHECK':
        return to === 'EXECUTING' || to === 'DENIED' || to === 'FAILED';
      case 'EXECUTING':
        return to === 'TOOL_RESULT' || to === 'FAILED';
      case 'TOOL_RESULT':
        return to === 'FOLLOWUP_REQUEST' || to === 'FAILED';
      case 'FOLLOWUP_REQUEST':
        return to === 'REQUESTING' || to === 'TOOL_CALL_RECEIVED' || to === 'STREAMING' || to === 'COMPLETED' || to === 'FAILED';
      case 'STREAMING':
        return to === 'COMPLETED' || to === 'FAILED';
      case 'COMPLETED':
      case 'FAILED':
      case 'DENIED':
        return false;
      default:
        return false;
    }
  }
}
