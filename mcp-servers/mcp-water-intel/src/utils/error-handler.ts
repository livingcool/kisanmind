import { Logger } from './logger.js';

/**
 * Centralized error handler for MCP tool responses
 */
export class ErrorHandler {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ErrorHandler');
  }

  handleToolError(error: unknown, toolName: string): {
    content: Array<{ type: string; text: string }>;
    isError: true;
  } {
    this.logger.error(`Error in tool ${toolName}:`, error);

    let userMessage = 'An unexpected error occurred while analyzing water data.';

    if (error instanceof Error) {
      const errorMessage = error.message.toUpperCase();

      if (errorMessage.includes('RATE_LIMIT') || errorMessage.includes('429')) {
        userMessage = 'The water data service is currently busy. Please try again in a few moments.';
      } else if (errorMessage.includes('TIMEOUT') || errorMessage.includes('ECONNABORTED')) {
        userMessage = 'The water data service is taking too long to respond.';
      } else if (errorMessage.includes('NETWORK') || errorMessage.includes('ECONNREFUSED')) {
        userMessage = 'Unable to connect to water data services. Please check your internet connection.';
      } else if (errorMessage.includes('INVALID_COORDINATES')) {
        userMessage = 'The provided coordinates are invalid.';
      } else {
        userMessage = `Error retrieving water data: ${error.message}`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            error: { message: userMessage, tool: toolName },
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

export function validateCoordinates(lat: number, lng: number): void {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error(`INVALID_COORDINATES: Latitude ${lat} or longitude ${lng} is out of valid range`);
  }
}
