/**
 * Retry utility with exponential backoff for API calls
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

/**
 * Retries an async operation with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Result of the function
 */
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

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Check if error is retryable
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

      if (!isRetryable) {
        // Don't retry non-retryable errors
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
    }
  }

  throw lastError || new Error('Retry failed with unknown error');
}
