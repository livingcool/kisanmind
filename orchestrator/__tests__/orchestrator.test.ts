/**
 * Tests for the KisanMind Orchestrator
 *
 * Tests the orchestration logic including:
 * - Parallel MCP server dispatch
 * - Partial failure handling
 * - Timeout behavior
 * - Progress reporting
 * - Data aggregation
 *
 * Uses mocks for IntakeAgent, SynthesisAgent, and MCP clients
 * to test orchestration logic independently.
 */

// Mock the MCP client module before imports
jest.mock('../mcp-client.js', () => ({
  callSoilServer: jest.fn(),
  callWaterServer: jest.fn(),
  callClimateServer: jest.fn(),
  callMarketServer: jest.fn(),
  callSchemeServer: jest.fn(),
  withTimeout: jest.fn((promise: Promise<unknown>) => promise),
}));

// Mock the IntakeAgent
jest.mock('../intake-agent.js', () => ({
  IntakeAgent: jest.fn().mockImplementation(() => ({
    parseInput: jest.fn(),
  })),
}));

// Mock the SynthesisAgent
jest.mock('../synthesis-agent.js', () => ({
  SynthesisAgent: jest.fn().mockImplementation(() => ({
    synthesize: jest.fn(),
  })),
}));

import { Orchestrator, type ProgressCallback } from '../orchestrator.js';
import type {
  OrchestratorConfig,
  FarmerProfile,
  MCPServerResponse,
  FarmingDecisionReport,
} from '../types.js';
import { IntakeAgent } from '../intake-agent.js';
import { SynthesisAgent } from '../synthesis-agent.js';
import {
  callSoilServer,
  callWaterServer,
  callClimateServer,
  callMarketServer,
  callSchemeServer,
} from '../mcp-client.js';

// ----- Test Fixtures -----

const TEST_CONFIG: OrchestratorConfig = {
  anthropicApiKey: 'test-api-key',
  mcpServerTimeout_ms: 5000,
  intakeModel: 'claude-haiku-4-5-20250315',
  synthesisModel: 'claude-opus-4-6-20250514',
  extendedThinkingBudget: 10000,
  maxRetries: 1,
};

const MOCK_PROFILE: FarmerProfile = {
  location: {
    latitude: 20.5,
    longitude: 78.5,
    state: 'Maharashtra',
    district: 'Nagpur',
    village: 'TestVillage',
  },
  landSize: { acres: 3, irrigated_acres: 2 },
  waterSource: 'borewell',
  currentCrops: ['cotton'],
  previousCrops: ['cotton'],
  budget_INR: 50000,
  language: 'English',
  rawInput: 'I am a farmer from Vidarbha',
  confidence: 0.9,
};

function makeMCPResponse(server: string, status: MCPServerResponse['status'] = 'success'): MCPServerResponse {
  return {
    server,
    status,
    data: status === 'success' ? { testData: `${server}-data` } : null,
    responseTime_ms: 100,
    error: status === 'error' ? `${server} failed` : undefined,
  };
}

const MOCK_REPORT: FarmingDecisionReport = {
  summary: 'Plant soybean for maximum profit.',
  primaryRecommendation: {
    crop: 'Soybean',
    variety: 'JS 335',
    expectedProfit_per_acre: 25000,
    sowingDate: 'June 15-30',
    confidence: 'high',
  },
  alternativeOptions: [
    { crop: 'Chickpea', expectedProfit_per_acre: 18000, reason: 'Lower water requirement' },
  ],
  waterStrategy: {
    irrigationMethod: 'drip',
    waterSchedule: 'Every 7 days, 25mm',
    waterSavingTips: ['Use mulch', 'Drip irrigation'],
  },
  marketStrategy: {
    bestSellingTime: 'October-November',
    bestMarket: 'Nagpur APMC',
    expectedPrice: 'INR 4500/quintal',
    storageAdvice: 'Store up to 3 months in dry godown',
  },
  governmentSupport: {
    schemesToApply: [
      {
        name: 'PM-KISAN',
        benefit: 'INR 6000/year',
        howToApply: 'Register at pmkisan.gov.in',
        deadline: 'Open enrollment',
      },
    ],
    totalBenefit: 'INR 6000 annual + crop insurance',
  },
  riskAssessment: [
    { risk: 'Drought', severity: 'high', mitigation: 'Drip irrigation and mulch' },
  ],
  monthlyActionPlan: [
    { month: 'June', actions: ['Prepare field', 'Sow soybean'] },
  ],
  disclaimer: 'Verify with local agriculture office.',
  language: 'English',
  generatedAt: new Date().toISOString(),
};

// ----- Tests -----

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;
  let mockIntakeAgent: { parseInput: jest.Mock };
  let mockSynthesisAgent: { synthesize: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    mockIntakeAgent = { parseInput: jest.fn().mockResolvedValue(MOCK_PROFILE) };
    (IntakeAgent as jest.Mock).mockImplementation(() => mockIntakeAgent);

    mockSynthesisAgent = { synthesize: jest.fn().mockResolvedValue(MOCK_REPORT) };
    (SynthesisAgent as jest.Mock).mockImplementation(() => mockSynthesisAgent);

    // Default: all MCP servers succeed
    (callSoilServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-soil-intel'));
    (callWaterServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-water-intel'));
    (callClimateServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-climate-intel'));
    (callMarketServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-market-intel'));
    (callSchemeServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-scheme-intel'));

    orchestrator = new Orchestrator(TEST_CONFIG);
  });

  describe('process()', () => {
    it('should run the full pipeline successfully', async () => {
      const report = await orchestrator.process('I am a farmer from Vidarbha');

      expect(report).toBeDefined();
      expect(report.primaryRecommendation.crop).toBe('Soybean');
      expect(report.primaryRecommendation.expectedProfit_per_acre).toBe(25000);
    });

    it('should call intake agent with the farmer input', async () => {
      await orchestrator.process('I am a farmer from Vidarbha');

      expect(mockIntakeAgent.parseInput).toHaveBeenCalledWith('I am a farmer from Vidarbha');
      expect(mockIntakeAgent.parseInput).toHaveBeenCalledTimes(1);
    });

    it('should call all 5 MCP servers', async () => {
      await orchestrator.process('Test input');

      expect(callSoilServer).toHaveBeenCalledTimes(1);
      expect(callWaterServer).toHaveBeenCalledTimes(1);
      expect(callClimateServer).toHaveBeenCalledTimes(1);
      expect(callMarketServer).toHaveBeenCalledTimes(1);
      expect(callSchemeServer).toHaveBeenCalledTimes(1);
    });

    it('should pass farmer profile to all MCP servers', async () => {
      await orchestrator.process('Test input');

      expect(callSoilServer).toHaveBeenCalledWith(MOCK_PROFILE);
      expect(callWaterServer).toHaveBeenCalledWith(MOCK_PROFILE);
      expect(callClimateServer).toHaveBeenCalledWith(MOCK_PROFILE);
      expect(callMarketServer).toHaveBeenCalledWith(MOCK_PROFILE);
      expect(callSchemeServer).toHaveBeenCalledWith(MOCK_PROFILE);
    });

    it('should call synthesis agent with aggregated intelligence', async () => {
      await orchestrator.process('Test input');

      expect(mockSynthesisAgent.synthesize).toHaveBeenCalledTimes(1);
      const intelligence = mockSynthesisAgent.synthesize.mock.calls[0][0];
      expect(intelligence.farmerProfile).toEqual(MOCK_PROFILE);
      expect(intelligence.soilIntel).toBeDefined();
      expect(intelligence.waterIntel).toBeDefined();
      expect(intelligence.climateIntel).toBeDefined();
      expect(intelligence.marketIntel).toBeDefined();
      expect(intelligence.schemeIntel).toBeDefined();
      expect(intelligence.orchestrationMeta).toBeDefined();
    });
  });

  describe('processWithMeta()', () => {
    it('should return timing metadata', async () => {
      const result = await orchestrator.processWithMeta('Test input');

      expect(result.meta).toBeDefined();
      expect(result.meta.totalTime_ms).toBeGreaterThanOrEqual(0);
      expect(result.meta.intakeTime_ms).toBeGreaterThanOrEqual(0);
      expect(result.meta.mcpTime_ms).toBeGreaterThanOrEqual(0);
      expect(result.meta.synthesisTime_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return the farmer profile', async () => {
      const result = await orchestrator.processWithMeta('Test input');

      expect(result.profile).toEqual(MOCK_PROFILE);
    });

    it('should count successful MCP servers', async () => {
      const result = await orchestrator.processWithMeta('Test input');

      expect(result.meta.mcpSuccessCount).toBe(5);
      expect(result.meta.mcpFailedServers).toEqual([]);
    });
  });

  describe('partial failure handling', () => {
    it('should continue when one MCP server fails', async () => {
      (callSoilServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-soil-intel', 'error'));

      const result = await orchestrator.processWithMeta('Test input');

      expect(result.report).toBeDefined();
      expect(result.meta.mcpSuccessCount).toBe(4);
      expect(result.meta.mcpFailedServers).toContain('mcp-soil-intel');
    });

    it('should continue when multiple MCP servers fail', async () => {
      (callSoilServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-soil-intel', 'error'));
      (callWaterServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-water-intel', 'timeout'));
      (callClimateServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-climate-intel', 'error'));

      const result = await orchestrator.processWithMeta('Test input');

      expect(result.report).toBeDefined();
      expect(result.meta.mcpSuccessCount).toBe(2);
      expect(result.meta.mcpFailedServers).toHaveLength(3);
    });

    it('should continue even when ALL MCP servers fail', async () => {
      (callSoilServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-soil-intel', 'error'));
      (callWaterServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-water-intel', 'error'));
      (callClimateServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-climate-intel', 'error'));
      (callMarketServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-market-intel', 'error'));
      (callSchemeServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-scheme-intel', 'error'));

      const result = await orchestrator.processWithMeta('Test input');

      expect(result.report).toBeDefined();
      expect(result.meta.mcpSuccessCount).toBe(0);
      expect(result.meta.mcpFailedServers).toHaveLength(5);
    });

    it('should handle MCP servers that throw exceptions', async () => {
      (callSoilServer as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      const result = await orchestrator.processWithMeta('Test input');

      // Should still produce a report despite the exception
      expect(result.report).toBeDefined();
      expect(result.meta.mcpSuccessCount).toBeLessThanOrEqual(4);
    });

    it('should count partial status as successful', async () => {
      (callSoilServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-soil-intel', 'partial'));

      const result = await orchestrator.processWithMeta('Test input');

      // 'partial' counts as successful since it has useful data
      expect(result.meta.mcpSuccessCount).toBe(5);
    });
  });

  describe('progress reporting', () => {
    it('should report progress through all stages', async () => {
      const stages: string[] = [];
      const progressCallback: ProgressCallback = (stage) => {
        stages.push(stage);
      };

      const orchWithProgress = new Orchestrator(TEST_CONFIG, progressCallback);
      await orchWithProgress.process('Test input');

      // Should hit all major pipeline stages
      expect(stages).toContain('init');
      expect(stages).toContain('start');
      expect(stages).toContain('intake');
      expect(stages).toContain('intake-complete');
      expect(stages).toContain('mcp-start');
      expect(stages).toContain('mcp-complete');
      expect(stages).toContain('synthesis');
      expect(stages).toContain('synthesis-complete');
      expect(stages).toContain('complete');
    });

    it('should report individual MCP server progress', async () => {
      const stages: string[] = [];
      const progressCallback: ProgressCallback = (stage) => {
        stages.push(stage);
      };

      const orchWithProgress = new Orchestrator(TEST_CONFIG, progressCallback);
      await orchWithProgress.process('Test input');

      // Should report on each MCP server
      expect(stages.filter(s => s.startsWith('mcp-soil'))).toHaveLength(2); // start + done
      expect(stages.filter(s => s.startsWith('mcp-water'))).toHaveLength(2);
      expect(stages.filter(s => s.startsWith('mcp-climate'))).toHaveLength(2);
      expect(stages.filter(s => s.startsWith('mcp-market'))).toHaveLength(2);
      expect(stages.filter(s => s.startsWith('mcp-schemes'))).toHaveLength(2);
    });

    it('should report error stage on failure', async () => {
      const stages: string[] = [];
      const progressCallback: ProgressCallback = (stage) => {
        stages.push(stage);
      };

      // Make synthesis fail
      mockSynthesisAgent.synthesize.mockRejectedValue(new Error('API error'));

      const orchWithProgress = new Orchestrator(TEST_CONFIG, progressCallback);

      await expect(orchWithProgress.process('Test input')).rejects.toThrow('API error');
      expect(stages).toContain('error');
    });
  });

  describe('data aggregation', () => {
    it('should pass all MCP responses to synthesis agent', async () => {
      await orchestrator.process('Test input');

      const intelligence = mockSynthesisAgent.synthesize.mock.calls[0][0];

      expect(intelligence.soilIntel.server).toBe('mcp-soil-intel');
      expect(intelligence.waterIntel.server).toBe('mcp-water-intel');
      expect(intelligence.climateIntel.server).toBe('mcp-climate-intel');
      expect(intelligence.marketIntel.server).toBe('mcp-market-intel');
      expect(intelligence.schemeIntel.server).toBe('mcp-scheme-intel');
    });

    it('should include orchestration metadata', async () => {
      await orchestrator.process('Test input');

      const intelligence = mockSynthesisAgent.synthesize.mock.calls[0][0];

      expect(intelligence.orchestrationMeta.totalTime_ms).toBeGreaterThanOrEqual(0);
      expect(intelligence.orchestrationMeta.successfulServers).toBe(5);
      expect(intelligence.orchestrationMeta.failedServers).toEqual([]);
      expect(intelligence.orchestrationMeta.timestamp).toBeDefined();
    });

    it('should accurately track failed servers in metadata', async () => {
      (callWaterServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-water-intel', 'timeout'));
      (callMarketServer as jest.Mock).mockResolvedValue(makeMCPResponse('mcp-market-intel', 'error'));

      await orchestrator.process('Test input');

      const intelligence = mockSynthesisAgent.synthesize.mock.calls[0][0];

      expect(intelligence.orchestrationMeta.successfulServers).toBe(3);
      expect(intelligence.orchestrationMeta.failedServers).toContain('mcp-water-intel');
      expect(intelligence.orchestrationMeta.failedServers).toContain('mcp-market-intel');
    });
  });

  describe('getStats()', () => {
    it('should return orchestrator configuration', () => {
      const stats = orchestrator.getStats();

      expect(stats.config.intakeModel).toBe('claude-haiku-4-5-20250315');
      expect(stats.config.synthesisModel).toBe('claude-opus-4-6-20250514');
      expect(stats.config.timeout_ms).toBe(5000);
      expect(stats.config.maxRetries).toBe(1);
      expect(stats.config.extendedThinkingBudget).toBe(10000);
    });
  });
});
