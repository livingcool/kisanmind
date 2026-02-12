/**
 * Tests for the MCP Client module
 *
 * Tests timeout behavior, error handling, and safe import logic.
 * Uses fake timers to avoid dangling timer warnings.
 */

import { withTimeout } from '../mcp-client.js';
import type { MCPServerResponse } from '../types.js';

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function makeResponse(delay: number, server: string = 'test-server'): Promise<MCPServerResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          server,
          status: 'success',
          data: { result: 'ok' },
          responseTime_ms: delay,
        });
      }, delay);
    });
  }

  it('should return the result when server responds before timeout', async () => {
    const promise = withTimeout(makeResponse(50), 5000, 'test-server');

    jest.advanceTimersByTime(50);
    const result = await promise;

    expect(result.status).toBe('success');
    expect(result.data).toEqual({ result: 'ok' });
  });

  it('should return timeout response when server is too slow', async () => {
    const promise = withTimeout(makeResponse(5000), 100, 'slow-server');

    jest.advanceTimersByTime(100);
    const result = await promise;

    expect(result.status).toBe('timeout');
    expect(result.server).toBe('slow-server');
    expect(result.error).toContain('Timed out');
    expect(result.data).toBeNull();

    // Advance past the slow response to clean up the timer
    jest.advanceTimersByTime(5000);
  });

  it('should use the correct server name in timeout response', async () => {
    const promise = withTimeout(makeResponse(5000), 50, 'mcp-soil-intel');

    jest.advanceTimersByTime(50);
    const result = await promise;

    expect(result.server).toBe('mcp-soil-intel');

    jest.advanceTimersByTime(5000);
  });

  it('should report the timeout duration in the error message', async () => {
    const promise = withTimeout(makeResponse(5000), 200, 'test');

    jest.advanceTimersByTime(200);
    const result = await promise;

    expect(result.error).toContain('200ms');
    expect(result.responseTime_ms).toBe(200);

    jest.advanceTimersByTime(5000);
  });

  it('should handle immediately resolving promises', async () => {
    const instant = Promise.resolve<MCPServerResponse>({
      server: 'fast-server',
      status: 'success',
      data: { fast: true },
      responseTime_ms: 1,
    });

    const result = await withTimeout(instant, 5000, 'fast-server');

    expect(result.status).toBe('success');
    expect(result.data).toEqual({ fast: true });
  });

  it('should handle promises that resolve with error status', async () => {
    const errorPromise = Promise.resolve<MCPServerResponse>({
      server: 'error-server',
      status: 'error',
      data: null,
      responseTime_ms: 50,
      error: 'Module not available',
    });

    const result = await withTimeout(errorPromise, 5000, 'error-server');

    expect(result.status).toBe('error');
    expect(result.error).toBe('Module not available');
  });
});

describe('MCP server call functions', () => {
  it('should export all 5 server call functions', async () => {
    const mcpClient = await import('../mcp-client.js');

    expect(typeof mcpClient.callSoilServer).toBe('function');
    expect(typeof mcpClient.callWaterServer).toBe('function');
    expect(typeof mcpClient.callClimateServer).toBe('function');
    expect(typeof mcpClient.callMarketServer).toBe('function');
    expect(typeof mcpClient.callSchemeServer).toBe('function');
    expect(typeof mcpClient.withTimeout).toBe('function');
  });
});
