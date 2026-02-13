/**
 * Main Orchestrator - Coordinates the entire KisanMind pipeline
 *
 * Pipeline:
 * 1. Intake Agent (Haiku 4.5) -> parses farmer input into structured profile
 * 2. MCP Clients (parallel) -> calls 5 MCP servers simultaneously
 * 3. Synthesis Agent (Opus 4.6 + extended thinking) -> generates final report
 *
 * Key design decisions:
 * - Uses Promise.allSettled() for MCP server calls so partial failures
 *   never crash the pipeline
 * - Each MCP call has an independent timeout
 * - Progress callbacks enable real-time UI updates
 * - Retry logic for transient API failures
 */
import type {
  FarmerProfile,
  AggregatedIntelligence,
  FarmingDecisionReport,
  OrchestratorConfig,
  MCPServerResponse,
  VisualIntelligence,
} from './types.js';
import { IntakeAgent } from './intake-agent.js';
import { SynthesisAgent } from './synthesis-agent.js';
import {
  callSoilServer,
  callWaterServer,
  callClimateServer,
  callMarketServer,
  callSchemeServer,
  withTimeout,
} from './mcp-client.js';

/**
 * Progress reporting callback type.
 * Consumers (frontend, CLI) implement this to receive real-time updates.
 */
export type ProgressCallback = (stage: string, message: string, data?: unknown) => void;

/**
 * Result from a single pipeline run, including metadata for debugging
 */
export interface PipelineResult {
  report: FarmingDecisionReport;
  profile: FarmerProfile;
  meta: {
    totalTime_ms: number;
    intakeTime_ms: number;
    mcpTime_ms: number;
    synthesisTime_ms: number;
    mcpSuccessCount: number;
    mcpFailedServers: string[];
    hasVisualData: boolean;
  };
}

/**
 * Optional visual intelligence data that can be provided to the pipeline.
 * When available, this is included as a 6th intelligence source alongside
 * the 5 MCP servers.
 */
export interface PipelineOptions {
  /** Pre-computed visual intelligence from farmer-uploaded images */
  visualIntelligence?: VisualIntelligence | null;
}

export class Orchestrator {
  private config: OrchestratorConfig;
  private intakeAgent: IntakeAgent;
  private synthesisAgent: SynthesisAgent;
  private progressCallback?: ProgressCallback;

  constructor(config: OrchestratorConfig, progressCallback?: ProgressCallback) {
    this.config = config;
    this.progressCallback = progressCallback;

    this.intakeAgent = new IntakeAgent(config.anthropicApiKey, config.intakeModel);
    this.synthesisAgent = new SynthesisAgent(
      config.anthropicApiKey,
      config.synthesisModel,
      config.extendedThinkingBudget
    );

    this.reportProgress('init', 'Orchestrator initialized', {
      intakeModel: config.intakeModel,
      synthesisModel: config.synthesisModel,
      timeout: config.mcpServerTimeout_ms,
    });
  }

  /**
   * Main orchestration method - processes farmer input end-to-end.
   *
   * Returns a PipelineResult with both the report and timing metadata.
   * For backward compatibility, the process() method returns just the report.
   *
   * @param farmerInput - Raw farmer input text
   * @param options - Optional pipeline options (e.g., visual intelligence data)
   */
  async processWithMeta(farmerInput: string, options?: PipelineOptions): Promise<PipelineResult> {
    const pipelineStart = Date.now();
    const visualIntel = options?.visualIntelligence ?? null;
    const hasVisualData = visualIntel !== null;

    this.reportProgress('start', 'Starting KisanMind pipeline', {
      input: farmerInput,
      hasVisualData,
    });

    try {
      // STAGE 1: Parse farmer input with Haiku 4.5
      this.reportProgress('intake', 'Parsing farmer input with Haiku 4.5...');
      const intakeStart = Date.now();
      const profile = await this.runWithRetry(
        () => this.intakeAgent.parseInput(farmerInput),
        'IntakeAgent',
        1 // Only 1 retry for intake
      );
      const intakeTime = Date.now() - intakeStart;
      this.reportProgress('intake-complete', 'Farmer profile extracted', {
        profile,
        time_ms: intakeTime,
      });

      // STAGE 2: Call all 5 MCP servers in parallel
      const serverList = ['soil', 'water', 'climate', 'market', 'schemes'];
      if (hasVisualData) {
        serverList.push('visual');
      }
      this.reportProgress('mcp-start', `Calling ${serverList.length} intelligence sources in parallel...`, {
        servers: serverList,
      });

      const mcpStart = Date.now();
      const intelligence = await this.gatherIntelligence(profile, visualIntel);
      const mcpTime = Date.now() - mcpStart;

      this.reportProgress('mcp-complete', 'All intelligence sources responded', {
        successful: intelligence.orchestrationMeta.successfulServers,
        failed: intelligence.orchestrationMeta.failedServers,
        hasVisualData: intelligence.orchestrationMeta.hasVisualData,
        totalTime_ms: mcpTime,
      });

      // Check if we have enough data to proceed
      if (intelligence.orchestrationMeta.successfulServers === 0 && !hasVisualData) {
        this.reportProgress('mcp-warning', 'All intelligence sources failed - synthesis will use model knowledge only');
      }

      // STAGE 3: Synthesize final report with Opus 4.6 + extended thinking
      this.reportProgress('synthesis', 'Generating final report with Opus 4.6 (extended thinking)...');
      const synthesisStart = Date.now();
      const report = await this.runWithRetry(
        () => this.synthesisAgent.synthesize(intelligence),
        'SynthesisAgent',
        1 // Only 1 retry for synthesis (expensive call)
      );
      const synthesisTime = Date.now() - synthesisStart;

      this.reportProgress('synthesis-complete', 'Final report generated', {
        crop: report.primaryRecommendation.crop,
        profit: report.primaryRecommendation.expectedProfit_per_acre,
        time_ms: synthesisTime,
      });

      // STAGE 4: Complete
      const totalTime = Date.now() - pipelineStart;
      this.reportProgress('complete', `KisanMind pipeline complete in ${totalTime}ms`, {
        totalTime_ms: totalTime,
        intakeTime_ms: intakeTime,
        mcpTime_ms: mcpTime,
        synthesisTime_ms: synthesisTime,
        hasVisualData,
        recommendation: report.primaryRecommendation,
      });

      return {
        report,
        profile,
        meta: {
          totalTime_ms: totalTime,
          intakeTime_ms: intakeTime,
          mcpTime_ms: mcpTime,
          synthesisTime_ms: synthesisTime,
          mcpSuccessCount: intelligence.orchestrationMeta.successfulServers,
          mcpFailedServers: intelligence.orchestrationMeta.failedServers,
          hasVisualData,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.reportProgress('error', `Pipeline failed: ${errorMsg}`, { error: errorMsg });
      throw error;
    }
  }

  /**
   * Backward-compatible process method that returns just the report
   */
  async process(farmerInput: string, options?: PipelineOptions): Promise<FarmingDecisionReport> {
    const result = await this.processWithMeta(farmerInput, options);
    return result.report;
  }

  /**
   * Gather intelligence from all 5 MCP servers in parallel, plus optional
   * visual intelligence from farmer-uploaded images.
   *
   * Uses Promise.allSettled() so that failures in one server never
   * prevent other servers from completing. Each server also has an
   * independent timeout via withTimeout().
   *
   * @param profile - Farmer profile from intake agent
   * @param visualIntel - Optional pre-computed visual intelligence data
   */
  private async gatherIntelligence(
    profile: FarmerProfile,
    visualIntel?: VisualIntelligence | null,
  ): Promise<AggregatedIntelligence> {
    const start = Date.now();
    const timeout = this.config.mcpServerTimeout_ms;

    // Log visual data availability
    if (visualIntel) {
      this.reportProgress('visual', 'Visual intelligence data available', {
        hasSoilData: visualIntel.hasSoilData,
        hasCropData: visualIntel.hasCropData,
        confidence: visualIntel.overallConfidence,
      });
    }

    // Launch all 5 MCP server calls in parallel using Promise.allSettled
    // This ensures one slow/failed server does not block others
    const results = await Promise.allSettled([
      this.callServerSafe('soil', () => withTimeout(callSoilServer(profile), timeout, 'mcp-soil-intel')),
      this.callServerSafe('water', () => withTimeout(callWaterServer(profile), timeout, 'mcp-water-intel')),
      this.callServerSafe('climate', () => withTimeout(callClimateServer(profile), timeout, 'mcp-climate-intel')),
      this.callServerSafe('market', () => withTimeout(callMarketServer(profile), timeout, 'mcp-market-intel')),
      this.callServerSafe('schemes', () => withTimeout(callSchemeServer(profile), timeout, 'mcp-scheme-intel')),
    ]);

    // Extract results, converting rejected promises to error responses
    const [soilResult, waterResult, climateResult, marketResult, schemeResult] = results;

    const extractResponse = (
      result: PromiseSettledResult<MCPServerResponse>,
      serverName: string
    ): MCPServerResponse => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      // This should rarely happen since callServerSafe catches errors,
      // but handle it defensively
      const errorMsg = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
      console.error(`[Orchestrator] Unexpected rejection from ${serverName}: ${errorMsg}`);
      return {
        server: serverName,
        status: 'error',
        data: null,
        responseTime_ms: Date.now() - start,
        error: `Unexpected failure: ${errorMsg}`,
      };
    };

    const soilIntel = extractResponse(soilResult, 'mcp-soil-intel');
    const waterIntel = extractResponse(waterResult, 'mcp-water-intel');
    const climateIntel = extractResponse(climateResult, 'mcp-climate-intel');
    const marketIntel = extractResponse(marketResult, 'mcp-market-intel');
    const schemeIntel = extractResponse(schemeResult, 'mcp-scheme-intel');

    const totalTime = Date.now() - start;

    // Calculate stats
    const allResponses = [soilIntel, waterIntel, climateIntel, marketIntel, schemeIntel];
    const successfulServers = allResponses.filter(r => r.status === 'success' || r.status === 'partial').length;
    const failedServers = allResponses
      .filter(r => r.status === 'error' || r.status === 'timeout')
      .map(r => r.server);

    const hasVisualData = visualIntel !== null && visualIntel !== undefined;
    const sourceCount = hasVisualData ? '5 MCP + visual' : '5 MCP';
    console.log(`[Orchestrator] ${sourceCount} sources completed in ${totalTime}ms: ${successfulServers} MCP succeeded, ${failedServers.length} MCP failed${hasVisualData ? ', visual data included' : ''}`);

    return {
      farmerProfile: profile,
      soilIntel,
      waterIntel,
      climateIntel,
      marketIntel,
      schemeIntel,
      visualIntel: visualIntel ?? null,
      orchestrationMeta: {
        totalTime_ms: totalTime,
        successfulServers,
        failedServers,
        timestamp: new Date().toISOString(),
        hasVisualData,
      },
    };
  }

  /**
   * Call an MCP server safely - catches all errors and returns an error response
   * instead of throwing. This ensures Promise.allSettled never sees rejections.
   */
  private async callServerSafe(
    serverName: string,
    call: () => Promise<MCPServerResponse>
  ): Promise<MCPServerResponse> {
    const start = Date.now();
    this.reportProgress(`mcp-${serverName}`, `Calling ${serverName} MCP server...`);

    try {
      const result = await call();
      this.reportProgress(`mcp-${serverName}-done`, `${serverName} responded: ${result.status} (${result.responseTime_ms}ms)`, {
        status: result.status,
        time_ms: result.responseTime_ms,
      });
      return result;
    } catch (error) {
      const elapsed = Date.now() - start;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] ${serverName} threw unexpected error: ${errorMsg}`);
      this.reportProgress(`mcp-${serverName}-error`, `${serverName} failed: ${errorMsg}`, {
        error: errorMsg,
        time_ms: elapsed,
      });
      return {
        server: `mcp-${serverName}-intel`,
        status: 'error',
        data: null,
        responseTime_ms: elapsed,
        error: errorMsg,
      };
    }
  }

  /**
   * Run an async operation with retry logic.
   *
   * Uses exponential backoff: 1s, 2s, 4s...
   * Only retries on transient errors (network, overload).
   */
  private async runWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoff = Math.pow(2, attempt - 1) * 1000;
          console.log(`[Orchestrator] Retrying ${operationName} (attempt ${attempt + 1}/${maxRetries + 1}) after ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on transient errors
        if (!this.isRetryableError(error)) {
          console.error(`[Orchestrator] ${operationName} failed with non-retryable error: ${lastError.message}`);
          throw lastError;
        }

        console.warn(`[Orchestrator] ${operationName} attempt ${attempt + 1} failed: ${lastError.message}`);
      }
    }

    throw lastError ?? new Error(`${operationName} failed after ${maxRetries + 1} attempts`);
  }

  /**
   * Determine if an error is transient and worth retrying
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      // Network errors
      if (msg.includes('network') || msg.includes('econnreset') || msg.includes('econnrefused')) return true;
      if (msg.includes('timeout') || msg.includes('timed out')) return true;
      // API overload
      if (msg.includes('overloaded') || msg.includes('rate_limit') || msg.includes('529') || msg.includes('503')) return true;
    }
    return false;
  }

  /**
   * Report progress to the callback if provided
   */
  private reportProgress(stage: string, message: string, data?: unknown): void {
    if (this.progressCallback) {
      this.progressCallback(stage, message, data);
    }
    console.log(`[Orchestrator] ${stage}: ${message}`);
  }

  /**
   * Get orchestrator configuration stats (useful for debugging)
   */
  getStats() {
    return {
      config: {
        intakeModel: this.config.intakeModel,
        synthesisModel: this.config.synthesisModel,
        timeout_ms: this.config.mcpServerTimeout_ms,
        maxRetries: this.config.maxRetries,
        extendedThinkingBudget: this.config.extendedThinkingBudget,
      },
    };
  }
}
