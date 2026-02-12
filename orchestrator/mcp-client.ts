/**
 * MCP Client - Calls individual MCP server analyzers directly
 *
 * Instead of spawning MCP server processes, this module directly imports
 * and calls the analyzer functions from each MCP server module.
 * This is simpler for the hackathon and avoids process management complexity.
 *
 * In production, these would be actual MCP client connections via stdio/SSE.
 *
 * Each function:
 * 1. Dynamically imports the analyzer module
 * 2. Calls the analyze function with farmer profile data
 * 3. Wraps the result in a standardized MCPServerResponse
 * 4. Catches all errors and returns error responses (never throws)
 */
import type { FarmerProfile, MCPServerResponse } from './types.js';

/**
 * Dynamic import wrapper that handles module loading failures gracefully.
 * Returns null if the module cannot be loaded (e.g., not yet built).
 */
async function safeImport<T>(modulePath: string, serverName: string): Promise<T | null> {
  try {
    return await import(modulePath) as T;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[MCPClient] Failed to import ${serverName} at ${modulePath}: ${msg}`);
    return null;
  }
}

/**
 * Create an error response for a server
 */
function errorResponse(server: string, start: number, error: string): MCPServerResponse {
  return {
    server,
    status: 'error',
    data: null,
    responseTime_ms: Date.now() - start,
    error,
  };
}

/**
 * Call the Soil Intelligence MCP server.
 * Analyzes soil composition, texture, pH, nutrients, and crop suitability.
 */
export async function callSoilServer(profile: FarmerProfile): Promise<MCPServerResponse> {
  const start = Date.now();
  const server = 'mcp-soil-intel';

  try {
    const module = await safeImport<{ analyzeSoil: (lat: number, lng: number) => Promise<unknown> }>(
      '../../mcp-servers/mcp-soil-intel/dist/soil-analyzer.js',
      server
    );

    if (!module?.analyzeSoil) {
      return errorResponse(server, start, 'Soil analyzer module not available or missing analyzeSoil export');
    }

    const result = await module.analyzeSoil(profile.location.latitude, profile.location.longitude);
    return { server, status: 'success', data: result, responseTime_ms: Date.now() - start };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MCPClient] ${server} error:`, errorMsg);
    return errorResponse(server, start, errorMsg);
  }
}

/**
 * Call the Water Intelligence MCP server.
 * Analyzes rainfall, groundwater, irrigation needs, and crop water feasibility.
 */
export async function callWaterServer(profile: FarmerProfile): Promise<MCPServerResponse> {
  const start = Date.now();
  const server = 'mcp-water-intel';

  try {
    const module = await safeImport<{ analyzeWater: (lat: number, lng: number) => Promise<unknown> }>(
      '../../mcp-servers/mcp-water-intel/dist/water-analyzer.js',
      server
    );

    if (!module?.analyzeWater) {
      return errorResponse(server, start, 'Water analyzer module not available or missing analyzeWater export');
    }

    const result = await module.analyzeWater(profile.location.latitude, profile.location.longitude);
    return { server, status: 'success', data: result, responseTime_ms: Date.now() - start };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MCPClient] ${server} error:`, errorMsg);
    return errorResponse(server, start, errorMsg);
  }
}

/**
 * Call the Climate Intelligence MCP server.
 * Analyzes weather forecasts, temperature, humidity, and crop climate suitability.
 */
export async function callClimateServer(profile: FarmerProfile): Promise<MCPServerResponse> {
  const start = Date.now();
  const server = 'mcp-climate-intel';

  try {
    const module = await safeImport<{ analyzeClimate: (lat: number, lng: number) => Promise<unknown> }>(
      '../../mcp-servers/mcp-climate-intel/dist/climate-analyzer.js',
      server
    );

    if (!module?.analyzeClimate) {
      return errorResponse(server, start, 'Climate analyzer module not available or missing analyzeClimate export');
    }

    const result = await module.analyzeClimate(profile.location.latitude, profile.location.longitude);
    return { server, status: 'success', data: result, responseTime_ms: Date.now() - start };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MCPClient] ${server} error:`, errorMsg);
    return errorResponse(server, start, errorMsg);
  }
}

/**
 * Call the Market Intelligence MCP server.
 * Analyzes crop prices, nearby mandis, profit estimates, and market trends.
 */
export async function callMarketServer(profile: FarmerProfile): Promise<MCPServerResponse> {
  const start = Date.now();
  const server = 'mcp-market-intel';

  try {
    const module = await safeImport<{ analyzeMarket: (lat: number, lng: number) => Promise<unknown> }>(
      '../../mcp-servers/mcp-market-intel/dist/market-analyzer.js',
      server
    );

    if (!module?.analyzeMarket) {
      return errorResponse(server, start, 'Market analyzer module not available or missing analyzeMarket export');
    }

    const result = await module.analyzeMarket(profile.location.latitude, profile.location.longitude);
    return { server, status: 'success', data: result, responseTime_ms: Date.now() - start };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MCPClient] ${server} error:`, errorMsg);
    return errorResponse(server, start, errorMsg);
  }
}

/**
 * Call the Government Scheme Intelligence MCP server.
 * Matches farmer profile to eligible schemes, subsidies, insurance, and credit.
 */
export async function callSchemeServer(profile: FarmerProfile): Promise<MCPServerResponse> {
  const start = Date.now();
  const server = 'mcp-scheme-intel';

  try {
    const module = await safeImport<{
      analyzeSchemes: (lat: number, lng: number, land: number, crops: string[]) => Promise<unknown>
    }>(
      '../../mcp-servers/mcp-scheme-intel/dist/index.js',
      server
    );

    if (!module?.analyzeSchemes) {
      return errorResponse(server, start, 'Scheme analyzer module not available or missing analyzeSchemes export');
    }

    const result = await module.analyzeSchemes(
      profile.location.latitude,
      profile.location.longitude,
      profile.landSize.acres,
      profile.currentCrops
    );
    return { server, status: 'success', data: result, responseTime_ms: Date.now() - start };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MCPClient] ${server} error:`, errorMsg);
    return errorResponse(server, start, errorMsg);
  }
}

/**
 * Wrap a server call with a timeout.
 *
 * If the server does not respond within timeoutMs, returns a timeout response
 * instead of waiting indefinitely. The original promise continues running
 * but its result is discarded.
 *
 * Note: This does NOT cancel the underlying HTTP requests. In production,
 * use AbortController for true cancellation.
 */
export function withTimeout(
  promise: Promise<MCPServerResponse>,
  timeoutMs: number,
  serverName: string
): Promise<MCPServerResponse> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<MCPServerResponse>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`[MCPClient] ${serverName} timed out after ${timeoutMs}ms`);
      resolve({
        server: serverName,
        status: 'timeout',
        data: null,
        responseTime_ms: timeoutMs,
        error: `Timed out after ${timeoutMs}ms`,
      });
    }, timeoutMs);
  });

  return Promise.race([
    promise.then(result => {
      clearTimeout(timeoutId);
      return result;
    }),
    timeoutPromise,
  ]);
}
