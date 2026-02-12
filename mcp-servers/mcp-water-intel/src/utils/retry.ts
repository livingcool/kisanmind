/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 10000,
};

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) break;

      const errorMessage = lastError.message.toUpperCase();
      const isRetryable =
        errorMessage.includes('RATE_LIMIT') ||
        errorMessage.includes('TIMEOUT') ||
        errorMessage.includes('ECONNABORTED') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('503') ||
        errorMessage.includes('502') ||
        errorMessage.includes('429');

      if (!isRetryable) break;

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
    }
  }

  throw lastError || new Error('Retry failed with unknown error');
}
