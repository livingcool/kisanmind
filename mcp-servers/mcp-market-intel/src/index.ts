#!/usr/bin/env node
/**
 * MCP Market Intelligence Server
 *
 * Provides market analysis tools: crop prices, nearby mandis,
 * profit estimates, and market trends for agricultural decision-making.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { analyzeMarket } from './market-analyzer.js';
import { validateCoordinates, ErrorHandler } from './utils/error-handler.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('MCPMarketIntel');
const errorHandler = new ErrorHandler();

const server = new Server(
  { name: 'mcp-market-intel', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_market',
        description:
          'Analyze crop market conditions for a given location. Returns current crop prices, nearby mandis, ' +
          'market trends, profit estimates per acre, and selling recommendations.',
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

  if (name === 'analyze_market') {
    try {
      const lat = args?.latitude as number;
      const lng = args?.longitude as number;
      if (lat === undefined || lng === undefined) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: 'latitude and longitude required' } }) }], isError: true };
      }
      validateCoordinates(lat, lng);
      logger.info(`Tool call: analyze_market at ${lat}, ${lng}`);
      const result = await analyzeMarket(lat, lng);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return errorHandler.handleToolError(error, 'analyze_market');
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: `Unknown tool: ${name}` } }) }], isError: true };
});

async function main(): Promise<void> {
  logger.info('Starting MCP Market Intelligence server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Market Intelligence server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error starting server', error);
  process.exit(1);
});
