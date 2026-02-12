#!/usr/bin/env node
/**
 * MCP Soil Intelligence Server
 *
 * Provides soil analysis tools for agricultural decision-making.
 * Integrates with SoilGrids and OpenLandMap APIs.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { analyzeSoil } from './soil-analyzer.js';
import { validateCoordinates, ErrorHandler } from './utils/error-handler.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('MCPSoilIntel');
const errorHandler = new ErrorHandler();

const server = new Server(
  {
    name: 'mcp-soil-intel',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Register available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_soil',
        description:
          'Analyze soil properties for a given location. Returns soil pH, organic carbon, ' +
          'nitrogen, texture, drainage class, crop suitability ratings, and farming recommendations. ' +
          'Data sourced from ISRIC SoilGrids and OpenLandMap.',
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

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'analyze_soil') {
    try {
      const lat = args?.latitude as number;
      const lng = args?.longitude as number;

      if (lat === undefined || lng === undefined) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: { message: 'latitude and longitude are required parameters' },
              }),
            },
          ],
          isError: true,
        };
      }

      validateCoordinates(lat, lng);

      logger.info(`Tool call: analyze_soil at ${lat}, ${lng}`);
      const result = await analyzeSoil(lat, lng);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return errorHandler.handleToolError(error, 'analyze_soil');
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ status: 'error', error: { message: `Unknown tool: ${name}` } }),
      },
    ],
    isError: true,
  };
});

/**
 * Start the MCP server
 */
async function main(): Promise<void> {
  logger.info('Starting MCP Soil Intelligence server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Soil Intelligence server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error starting server', error);
  process.exit(1);
});
