import { Logger } from './logger.js';

/**
 * Centralized error handler for MCP tool responses
 */
export class ErrorHandler {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ErrorHandler');
  }

  /**
   * Handle errors from tool execution and return MCP-formatted response
   */
  handleToolError(error: unknown, toolName: string): {
    content: Array<{ type: string; text: string }>;
    isError: true;
  } {
    this.logger.error(`Error in tool ${toolName}:`, error);

    let userMessage = 'An unexpected error occurred while analyzing soil data.';
    let technicalDetails = '';

    if (error instanceof Error) {
      const errorMessage = error.message.toUpperCase();

      if (errorMessage.includes('RATE_LIMIT') || errorMessage.includes('429')) {
        userMessage = 'The soil data service is currently busy. Please try again in a few moments.';
        technicalDetails = 'Rate limit exceeded on soil API';
      } else if (errorMessage.includes('TIMEOUT') || errorMessage.includes('ECONNABORTED')) {
        userMessage = 'The soil data service is taking too long to respond. The service may be slow or unavailable.';
        technicalDetails = 'Request timeout';
      } else if (errorMessage.includes('NETWORK') || errorMessage.includes('ECONNREFUSED')) {
        userMessage = 'Unable to connect to soil data services. Please check your internet connection.';
        technicalDetails = 'Network connection error';
      } else if (errorMessage.includes('INVALID_COORDINATES')) {
        userMessage = 'The provided coordinates are invalid. Please ensure latitude is between -90 and 90, and longitude is between -180 and 180.';
        technicalDetails = 'Invalid coordinate values';
      } else if (errorMessage.includes('NO_DATA')) {
        userMessage = 'No soil data is available for this location. The area may not be covered by our data sources.';
        technicalDetails = 'No data available for coordinates';
      } else {
        userMessage = `Error retrieving soil data: ${error.message}`;
        technicalDetails = error.stack || error.message;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            error: {
              message: userMessage,
              tool: toolName,
              details: process.env.DEBUG === 'true' ? technicalDetails : undefined,
            },
          }, null, 2),
        },
      ],
      isError: true,
    };
  }

  /**
   * Create a user-friendly error for invalid coordinates
   */
  static invalidCoordinatesError(lat: number, lng: number): Error {
    return new Error(`INVALID_COORDINATES: Latitude ${lat} or longitude ${lng} is out of valid range`);
  }

  /**
   * Create a user-friendly error for no data available
   */
  static noDataError(lat: number, lng: number): Error {
    return new Error(`NO_DATA: No soil data available for coordinates ${lat}, ${lng}`);
  }
}

/**
 * Validate coordinate ranges
 */
export function validateCoordinates(lat: number, lng: number): void {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw ErrorHandler.invalidCoordinatesError(lat, lng);
  }
}
