import { ToolExecutionError } from '../types/ToolExecutionError.js';

export class ToolTimeoutController {
  public static async runWithTimeout<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    toolName: string,
    timeoutMs = 30000,
    maxTimeoutMs = 120000,
    userSignal?: AbortSignal
  ): Promise<T> {
    if (userSignal?.aborted) {
      throw new ToolExecutionError({
        toolName,
        code: 'ABORTED',
        message: `Tool '${toolName}' execution was cancelled by caller signal.`,
      });
    }

    const effectiveTimeout = Math.min(timeoutMs, maxTimeoutMs);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), effectiveTimeout);

    const onUserAbort = () => controller.abort();
    if (userSignal) {
      userSignal.addEventListener('abort', onUserAbort);
    }

    try {
      return await fn(controller.signal);
    } catch (err: any) {
      if (err instanceof ToolExecutionError) {
        throw err;
      }
      if (err.name === 'AbortError' || controller.signal.aborted) {
        if (userSignal?.aborted) {
          throw new ToolExecutionError({
            toolName,
            code: 'ABORTED',
            message: `Tool '${toolName}' execution was cancelled by user.`,
          });
        }
        throw new ToolExecutionError({
          toolName,
          code: 'TIMEOUT',
          message: `Tool '${toolName}' execution timed out after ${effectiveTimeout}ms.`,
        });
      }
      throw err;
    } finally {
      clearTimeout(timer);
      if (userSignal) {
        userSignal.removeEventListener('abort', onUserAbort);
      }
    }
  }
}
