import { ILogger, LogLevel } from './ILogger.js';

export class ConsoleLogger implements ILogger {
  constructor(private minLevel: LogLevel = LogLevel.INFO) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error || '', meta || '');
    }
  }
}
