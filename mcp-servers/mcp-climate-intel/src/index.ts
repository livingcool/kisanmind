#!/usr/bin/env node
/**
 * MCP Climate Intelligence Server
 *
 * Provides climate analysis and weather forecast tools for agricultural decision-making.
 * Integrates with Open-Meteo and NASA POWER APIs.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { analyzeClimate } from './climate-analyzer.js';
import { validateCoordinates, ErrorHandler } from './utils/error-handler.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('MCPClimateIntel');
const errorHandler = new ErrorHandler();

const server = new Server(
  { name: 'mcp-climate-intel', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_climate',
        description:
          'Analyze climate conditions and weather forecasts for a given location. Returns current weather, ' +
          '16-day forecast, climate risks, growing conditions, crop-climate suitability, and recommendations.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            latitude: { type: 'number', description: 'Latitude (-90 to 90)', minimum: -90, maximum: 90 },
            longitude: { type: 'number', description: 'Longitude (-180 to 180)', minimum: -180, maximum: 180 },
          },
          required: ['latitude', 'longitude'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'analyze_climate') {
    try {
      const lat = args?.latitude as number;
      const lng = args?.longitude as number;
      if (lat === undefined || lng === undefined) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: 'latitude and longitude are required' } }) }], isError: true };
      }
      validateCoordinates(lat, lng);
      logger.info(`Tool call: analyze_climate at ${lat}, ${lng}`);
      const result = await analyzeClimate(lat, lng);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return errorHandler.handleToolError(error, 'analyze_climate');
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: `Unknown tool: ${name}` } }) }], isError: true };
});

async function main(): Promise<void> {
  logger.info('Starting MCP Climate Intelligence server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Climate Intelligence server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error starting server', error);
  process.exit(1);
});
