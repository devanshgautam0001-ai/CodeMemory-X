export interface CursorPosition {
  line: number;
  character: number;
}

export type TokenBudgetPreset = 2048 | 4096 | 8192 | 16384 | 32768 | 131072;

export interface DeveloperFocus {
  developerQuestion?: string;
  selectedFile?: string;
  cursorPosition?: CursorPosition;
  activeSymbol?: string;
  workspace?: string;
  tokenBudget?: TokenBudgetPreset | number;
}
