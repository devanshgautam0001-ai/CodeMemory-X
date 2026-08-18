import { describe, it, expect, vi } from 'vitest';
import { ConsoleLogger } from '../ConsoleLogger.js';
import { LogLevel } from '../ILogger.js';

describe('ConsoleLogger', () => {
  it('should log info messages when loglevel allows', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = new ConsoleLogger(LogLevel.INFO);

    logger.info('System initialized');
    expect(spy).toHaveBeenCalledWith('[INFO] System initialized', '');
    spy.mockRestore();
  });

  it('should suppress debug messages when minLevel is INFO', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = new ConsoleLogger(LogLevel.INFO);

    logger.debug('Verbose trace');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
