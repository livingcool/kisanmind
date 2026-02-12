import { Logger } from './logger.js';

export class ErrorHandler {
  private logger: Logger;
  constructor() { this.logger = new Logger('ErrorHandler'); }

  handleToolError(error: unknown, toolName: string) {
    this.logger.error(`Error in tool ${toolName}:`, error);
    let userMessage = 'An unexpected error occurred while analyzing climate data.';
    if (error instanceof Error) {
      const msg = error.message.toUpperCase();
      if (msg.includes('429') || msg.includes('RATE_LIMIT')) userMessage = 'Climate data service is busy. Please retry.';
      else if (msg.includes('TIMEOUT')) userMessage = 'Climate data service timed out.';
      else if (msg.includes('INVALID_COORDINATES')) userMessage = 'Invalid coordinates provided.';
      else userMessage = `Climate data error: ${error.message}`;
    }
    return {
      content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: userMessage, tool: toolName } }, null, 2) }],
      isError: true as const,
    };
  }
}

export function validateCoordinates(lat: number, lng: number): void {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error(`INVALID_COORDINATES: ${lat}, ${lng}`);
  }
}
