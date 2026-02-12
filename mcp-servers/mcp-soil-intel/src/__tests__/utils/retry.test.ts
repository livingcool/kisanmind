/**
 * Unit tests for Retry utility with exponential backoff
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retry } from '../../utils/retry.js';

type AsyncFn<T> = () => Promise<T>;

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Operations', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn<AsyncFn<string>>().mockResolvedValue('success');

      const result = await retry<string>(fn, { maxAttempts: 3, delayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return result after retrying once', async () => {
      const fn = jest.fn<AsyncFn<string>>()
        .mockRejectedValueOnce(new Error('TIMEOUT'))
        .mockResolvedValue('success');

      const result = await retry<string>(fn, { maxAttempts: 3, delayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should return result after multiple retries', async () => {
      const fn = jest.fn<AsyncFn<string>>()
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');

      const result = await retry<string>(fn, { maxAttempts: 4, delayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Retryable Errors', () => {
    it('should retry on RATE_LIMIT error', async () => {
      const fn = jest.fn<AsyncFn<string>>()
        .mockRejectedValueOnce(new Error('RATE_LIMIT exceeded'))
        .mockResolvedValue('success');

      await retry<string>(fn, { maxAttempts: 3, delayMs: 10 });

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on TIMEOUT error', async () => {
      const fn = jest.fn<AsyncFn<string>>()
        .mockRejectedValueOnce(new Error('TIMEOUT occurred'))
        .mockResolvedValue('success');

      await retry<string>(fn, { maxAttempts: 3, delayMs: 10 });

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 503 Service Unavailable', async () => {
      const fn = jest.fn<AsyncFn<string>>()
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockResolvedValue('success');

      await retry<string>(fn, { maxAttempts: 3, delayMs: 10 });

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 Too Many Requests', async () => {
      const fn = jest.fn<AsyncFn<string>>()
        .mockRejectedValueOnce(new Error('429 Too Many Requests'))
        .mockResolvedValue('success');

      await retry<string>(fn, { maxAttempts: 3, delayMs: 10 });

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Non-Retryable Errors', () => {
    it('should not retry on 404 Not Found', async () => {
      const fn = jest.fn<AsyncFn<string>>().mockRejectedValue(new Error('404 Not Found'));

      await expect(retry<string>(fn, { maxAttempts: 3, delayMs: 10 })).rejects.toThrow('404 Not Found');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on validation errors', async () => {
      const fn = jest.fn<AsyncFn<string>>().mockRejectedValue(new Error('Invalid input'));

      await expect(retry<string>(fn, { maxAttempts: 3, delayMs: 10 })).rejects.toThrow('Invalid input');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Max Attempts', () => {
    it('should stop after maxAttempts even if error is retryable', async () => {
      const fn = jest.fn<AsyncFn<string>>().mockRejectedValue(new Error('TIMEOUT'));

      await expect(retry<string>(fn, { maxAttempts: 3, delayMs: 10 })).rejects.toThrow('TIMEOUT');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use default maxAttempts of 3', async () => {
      const fn = jest.fn<AsyncFn<string>>().mockRejectedValue(new Error('503'));

      await expect(retry<string>(fn, { delayMs: 10 })).rejects.toThrow('503');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should preserve original error message', async () => {
      const originalError = new Error('Original error message');
      const fn = jest.fn<AsyncFn<string>>().mockRejectedValue(originalError);

      await expect(retry<string>(fn, { maxAttempts: 2, delayMs: 10 })).rejects.toThrow('Original error message');
    });
  });
});
