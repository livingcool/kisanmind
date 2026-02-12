/**
 * Simple logger utility for MCP server operations
 */
export class Logger {
  constructor(private context: string) {}

  info(message: string, ...args: unknown[]): void {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`, ...args);
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, error, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`, ...args);
    }
  }
}
