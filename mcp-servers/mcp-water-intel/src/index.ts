#!/usr/bin/env node
/**
 * MCP Water Intelligence Server
 *
 * Provides water analysis tools for agricultural decision-making.
 * Integrates with NASA POWER and Open-Meteo APIs.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { analyzeWater } from './water-analyzer.js';
import { validateCoordinates, ErrorHandler } from './utils/error-handler.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('MCPWaterIntel');
const errorHandler = new ErrorHandler();

const server = new Server(
  {
    name: 'mcp-water-intel',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_water',
        description:
          'Analyze water availability and irrigation needs for a given location. Returns rainfall data, ' +
          'drought risk, irrigation recommendations, crop water feasibility, and water management advice. ' +
          'Data sourced from NASA POWER and Open-Meteo.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude of the location (-90 to 90)',
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: 'number',
              description: 'Longitude of the location (-180 to 180)',
              minimum: -180,
              maximum: 180,
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

  if (name === 'analyze_water') {
    try {
      const lat = args?.latitude as number;
      const lng = args?.longitude as number;

      if (lat === undefined || lng === undefined) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: 'latitude and longitude are required' } }) }],
          isError: true,
        };
      }

      validateCoordinates(lat, lng);
      logger.info(`Tool call: analyze_water at ${lat}, ${lng}`);
      const result = await analyzeWater(lat, lng);

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorHandler.handleToolError(error, 'analyze_water');
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ status: 'error', error: { message: `Unknown tool: ${name}` } }) }],
    isError: true,
  };
});

async function main(): Promise<void> {
  logger.info('Starting MCP Water Intelligence server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Water Intelligence server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error starting server', error);
  process.exit(1);
});
