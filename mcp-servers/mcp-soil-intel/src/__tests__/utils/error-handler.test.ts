/**
 * Unit tests for Error Handler utility
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ErrorHandler, validateCoordinates } from '../../utils/error-handler.js';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete process.env.DEBUG;
  });

  describe('handleToolError', () => {
    it('should format rate limit errors with user-friendly message', () => {
      const error = new Error('RATE_LIMIT exceeded on API');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.status).toBe('error');
      expect(parsedContent.error.message).toContain('currently busy');
      expect(parsedContent.error.tool).toBe('analyze_soil');
    });

    it('should format 429 errors as rate limit errors', () => {
      const error = new Error('429 Too Many Requests');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('currently busy');
    });

    it('should format timeout errors with user-friendly message', () => {
      const error = new Error('TIMEOUT: Request took too long');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('too long to respond');
    });

    it('should format ECONNABORTED as timeout error', () => {
      const error = new Error('ECONNABORTED');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('too long to respond');
    });

    it('should format network errors with user-friendly message', () => {
      const error = new Error('NETWORK error: Connection failed');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('internet connection');
    });

    it('should format ECONNREFUSED as network error', () => {
      const error = new Error('ECONNREFUSED');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('internet connection');
    });

    it('should format invalid coordinates errors', () => {
      const error = new Error('INVALID_COORDINATES: Latitude 95 out of range');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('coordinates are invalid');
      expect(parsedContent.error.message).toContain('-90 and 90');
    });

    it('should format no data available errors', () => {
      const error = new Error('NO_DATA: No data for location');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('No soil data is available');
      expect(parsedContent.error.message).toContain('not be covered');
    });

    it('should format generic errors with original message', () => {
      const error = new Error('Some unexpected error');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('Some unexpected error');
    });

    it('should handle non-Error objects', () => {
      const response = errorHandler.handleToolError('string error', 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.status).toBe('error');
      expect(parsedContent.error.message).toContain('unexpected error');
    });

    it('should include technical details when DEBUG=true', () => {
      process.env.DEBUG = 'true';
      const error = new Error('Test error');
      error.stack = 'Stack trace here';

      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.details).toBeTruthy();
      expect(parsedContent.error.details).toContain('Stack trace');
    });

    it('should not include technical details when DEBUG is not set', () => {
      const error = new Error('Test error');
      error.stack = 'Stack trace here';

      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.details).toBeUndefined();
    });

    it('should log errors to console', () => {
      const error = new Error('Test error');
      errorHandler.handleToolError(error, 'analyze_soil');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should be case-insensitive for error matching', () => {
      const error = new Error('rate_limit exceeded');
      const response = errorHandler.handleToolError(error, 'analyze_soil');

      const parsedContent = JSON.parse(response.content[0].text);
      expect(parsedContent.error.message).toContain('currently busy');
    });
  });

  describe('Static Error Creators', () => {
    it('should create invalid coordinates error', () => {
      const error = ErrorHandler.invalidCoordinatesError(95, 200);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('INVALID_COORDINATES');
      expect(error.message).toContain('95');
      expect(error.message).toContain('200');
    });

    it('should create no data error', () => {
      const error = ErrorHandler.noDataError(20.9, 77.75);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('NO_DATA');
      expect(error.message).toContain('20.9');
      expect(error.message).toContain('77.75');
    });
  });
});

describe('validateCoordinates', () => {
  it('should not throw for valid coordinates', () => {
    expect(() => validateCoordinates(0, 0)).not.toThrow();
    expect(() => validateCoordinates(20.9, 77.75)).not.toThrow();
    expect(() => validateCoordinates(-20.9, -77.75)).not.toThrow();
    expect(() => validateCoordinates(90, 180)).not.toThrow();
    expect(() => validateCoordinates(-90, -180)).not.toThrow();
  });

  it('should throw for latitude > 90', () => {
    expect(() => validateCoordinates(91, 0)).toThrow('INVALID_COORDINATES');
  });

  it('should throw for latitude < -90', () => {
    expect(() => validateCoordinates(-91, 0)).toThrow('INVALID_COORDINATES');
  });

  it('should throw for longitude > 180', () => {
    expect(() => validateCoordinates(0, 181)).toThrow('INVALID_COORDINATES');
  });

  it('should throw for longitude < -180', () => {
    expect(() => validateCoordinates(0, -181)).toThrow('INVALID_COORDINATES');
  });

  it('should throw with both invalid latitude and longitude', () => {
    expect(() => validateCoordinates(95, 200)).toThrow('INVALID_COORDINATES');
  });

  it('should handle edge cases at exact boundaries', () => {
    expect(() => validateCoordinates(90, 180)).not.toThrow();
    expect(() => validateCoordinates(-90, -180)).not.toThrow();
    expect(() => validateCoordinates(90.0001, 0)).toThrow();
    expect(() => validateCoordinates(0, 180.0001)).toThrow();
  });

  it('should include coordinate values in error message', () => {
    try {
      validateCoordinates(95, 200);
      fail('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toContain('95');
      expect((error as Error).message).toContain('200');
    }
  });
});
