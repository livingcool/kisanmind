/**
 * Unit tests for Logger utility
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Logger } from '../../utils/logger.js';

describe('Logger', () => {
  let consoleSpy: {
    log: jest.SpiedFunction<typeof console.log>;
    warn: jest.SpiedFunction<typeof console.warn>;
    error: jest.SpiedFunction<typeof console.error>;
    debug: jest.SpiedFunction<typeof console.debug>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.debug.mockRestore();
    delete process.env.DEBUG;
  });

  it('should log info messages with correct format', () => {
    const logger = new Logger('TestContext');
    logger.info('Test message', { key: 'value' });

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      { key: 'value' }
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining('[TestContext]'),
      { key: 'value' }
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining('Test message'),
      { key: 'value' }
    );
  });

  it('should log warn messages with correct format', () => {
    const logger = new Logger('TestContext');
    logger.warn('Warning message');

    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringContaining('[WARN]')
    );
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringContaining('[TestContext]')
    );
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringContaining('Warning message')
    );
  });

  it('should log error messages with error object', () => {
    const logger = new Logger('TestContext');
    const testError = new Error('Test error');
    logger.error('Error occurred', testError);

    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      testError
    );
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('[TestContext]'),
      testError
    );
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('Error occurred'),
      testError
    );
  });

  it('should only log debug messages when DEBUG=true', () => {
    const logger = new Logger('TestContext');
    logger.debug('Debug message');

    // Should not log without DEBUG flag
    expect(consoleSpy.debug).not.toHaveBeenCalled();

    // Set DEBUG flag
    process.env.DEBUG = 'true';
    logger.debug('Debug message 2');

    // Should log with DEBUG flag
    expect(consoleSpy.debug).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG]')
    );
    expect(consoleSpy.debug).toHaveBeenCalledWith(
      expect.stringContaining('Debug message 2')
    );
  });

  it('should include timestamp in ISO format', () => {
    const logger = new Logger('TestContext');
    logger.info('Test');

    const logCall = consoleSpy.log.mock.calls[0][0] as string;
    const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
    expect(logCall).toMatch(isoDateRegex);
  });
});
