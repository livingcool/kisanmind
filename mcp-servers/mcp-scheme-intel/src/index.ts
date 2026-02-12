#!/usr/bin/env node
/**
 * MCP Government Scheme Intelligence Server
 *
 * Provides tools to find eligible government agricultural schemes,
 * subsidies, insurance, credit facilities, and application guidance.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { analyzeSchemes } from './scheme-analyzer.js';
import { validateCoordinates, ErrorHandler } from './utils/error-handler.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('MCPSchemeIntel');
const errorHandler = new ErrorHandler();

const server = new Server(
  { name: 'mcp-scheme-intel', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'find_schemes',
        description:
          'Find eligible government agricultural schemes, subsidies, insurance, and credit facilities ' +
          'for a farmer at a given location. Returns actionable application steps and deadlines.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            latitude: { type: 'number', description: 'Latitude (-90 to 90)', minimum: -90, maximum: 90 },
            longitude: { type: 'number', description: 'Longitude (-180 to 180)', minimum: -180, maximum: 180 },
            land_size_acres: { type: 'number', description: 'Farm land size in acres (default: 3)', minimum: 0 },
            crops: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of crops the farmer grows or plans to grow',
            },
          },
          required: ['latitude', 'longitude'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'find_schemes') {
    try {
      const lat = args?.latitude as number;
      const lng = args?.longitude as number;
      const landSize = (args?.land_size_acres as number) || 3;
      const crops = (args?.crops as string[]) || [];

      if (lat === undefined || lng === undefined) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: 'latitude and longitude required' } }) }], isError: true };
      }
      validateCoordinates(lat, lng);

      logger.info(`Tool call: find_schemes at ${lat}, ${lng}, land: ${landSize} acres`);
      const result = await analyzeSchemes(lat, lng, landSize, crops);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return errorHandler.handleToolError(error, 'find_schemes');
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: `Unknown tool: ${name}` } }) }], isError: true };
});

async function main(): Promise<void> {
  logger.info('Starting MCP Scheme Intelligence server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Scheme Intelligence server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error starting server', error);
  process.exit(1);
});
