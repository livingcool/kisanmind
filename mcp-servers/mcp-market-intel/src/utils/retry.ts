export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { maxAttempts: 3, delayMs: 1000, backoffFactor: 2, maxDelayMs: 10000, ...options };
  let lastError: Error | undefined;
  let delay = opts.delayMs;
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try { return await fn(); } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === opts.maxAttempts) break;
      const msg = lastError.message.toUpperCase();
      if (!['RATE_LIMIT','TIMEOUT','ECONNABORTED','ECONNRESET','ETIMEDOUT','503','502','429'].some(k => msg.includes(k))) break;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
    }
  }
  throw lastError || new Error('Retry failed');
}
