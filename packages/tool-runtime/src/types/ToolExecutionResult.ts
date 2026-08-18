export interface ToolExecutionErrorDetail {
  code: string;
  message: string;
}

export interface ToolExecutionResult {
  success: boolean;
  content: string | Record<string, unknown>;
  error?: ToolExecutionErrorDetail;
  metadata?: Record<string, unknown>;
  durationMs?: number;
}
