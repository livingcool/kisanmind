/**
 * Tests for the Synthesis Agent
 *
 * Tests extended thinking behavior, JSON parsing, and error handling.
 * Uses mocks for the Anthropic API.
 */

jest.mock('@anthropic-ai/sdk', () => {
  const mockAPIError = class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'APIError';
    }
  };

  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));

  // Attach APIError to the mock constructor
  (MockAnthropic as unknown as Record<string, unknown>).APIError = mockAPIError;

  return {
    __esModule: true,
    default: MockAnthropic,
  };
});

import { SynthesisAgent } from '../synthesis-agent.js';
import Anthropic from '@anthropic-ai/sdk';
import type { AggregatedIntelligence, FarmerProfile, MCPServerResponse } from '../types.js';

// ----- Test Fixtures -----

const MOCK_PROFILE: FarmerProfile = {
  location: {
    latitude: 20.5,
    longitude: 78.5,
    state: 'Maharashtra',
    district: 'Nagpur',
  },
  landSize: { acres: 3 },
  waterSource: 'borewell',
  currentCrops: ['cotton'],
  previousCrops: ['cotton'],
  budget_INR: 50000,
  language: 'English',
  rawInput: 'Test input',
  confidence: 0.9,
};

function makeMCPResponse(server: string, status: MCPServerResponse['status'] = 'success'): MCPServerResponse {
  return {
    server,
    status,
    data: status === 'success' ? { testData: true } : null,
    responseTime_ms: 100,
    error: status === 'error' ? 'test error' : undefined,
  };
}

const MOCK_INTELLIGENCE: AggregatedIntelligence = {
  farmerProfile: MOCK_PROFILE,
  soilIntel: makeMCPResponse('mcp-soil-intel'),
  waterIntel: makeMCPResponse('mcp-water-intel'),
  climateIntel: makeMCPResponse('mcp-climate-intel'),
  marketIntel: makeMCPResponse('mcp-market-intel'),
  schemeIntel: makeMCPResponse('mcp-scheme-intel'),
  visualIntel: null,
  orchestrationMeta: {
    totalTime_ms: 2000,
    successfulServers: 5,
    failedServers: [],
    timestamp: new Date().toISOString(),
    hasVisualData: false,
  },
};

const MOCK_REPORT_JSON = JSON.stringify({
  summary: 'Plant soybean for best returns.',
  primaryRecommendation: {
    crop: 'Soybean',
    variety: 'JS 335',
    expectedProfit_per_acre: 25000,
    sowingDate: 'June 15-30',
    confidence: 'high',
  },
  alternativeOptions: [],
  waterStrategy: {
    irrigationMethod: 'drip',
    waterSchedule: 'Weekly',
    waterSavingTips: ['Mulch'],
  },
  marketStrategy: {
    bestSellingTime: 'October',
    bestMarket: 'Nagpur APMC',
    expectedPrice: 'INR 4500/quintal',
    storageAdvice: '3 months',
  },
  governmentSupport: {
    schemesToApply: [{ name: 'PM-KISAN', benefit: 'INR 6000/year', howToApply: 'Online', deadline: 'Open' }],
    totalBenefit: 'INR 6000/year',
  },
  riskAssessment: [{ risk: 'Drought', severity: 'high', mitigation: 'Drip irrigation' }],
  monthlyActionPlan: [{ month: 'June', actions: ['Sow'] }],
  disclaimer: 'Verify locally.',
  language: 'English',
});

describe('SynthesisAgent', () => {
  let agent: SynthesisAgent;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new SynthesisAgent('test-api-key', 'claude-opus-4-6-20250514', 10000);
    const clientInstance = (Anthropic as unknown as jest.Mock).mock.results[0]?.value;
    mockCreate = clientInstance?.messages?.create;
  });

  describe('synthesize()', () => {
    it('should parse a valid JSON response with thinking blocks', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'thinking', thinking: 'Analyzing soil data and market prices...', signature: 'sig1' },
          { type: 'text', text: MOCK_REPORT_JSON },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      const report = await agent.synthesize(MOCK_INTELLIGENCE);

      expect(report.primaryRecommendation.crop).toBe('Soybean');
      expect(report.primaryRecommendation.expectedProfit_per_acre).toBe(25000);
      expect(report.generatedAt).toBeDefined();
    });

    it('should handle response without thinking blocks', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: MOCK_REPORT_JSON },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      const report = await agent.synthesize(MOCK_INTELLIGENCE);

      expect(report.primaryRecommendation.crop).toBe('Soybean');
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'thinking', thinking: 'Analysis...', signature: 'sig1' },
          { type: 'text', text: '```json\n' + MOCK_REPORT_JSON + '\n```' },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      const report = await agent.synthesize(MOCK_INTELLIGENCE);

      expect(report.primaryRecommendation.crop).toBe('Soybean');
    });

    it('should pass extended thinking configuration in the API call', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: MOCK_REPORT_JSON },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      await agent.synthesize(MOCK_INTELLIGENCE);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.thinking).toEqual({
        type: 'enabled',
        budget_tokens: 10000,
      });
      expect(callArgs.model).toBe('claude-opus-4-6-20250514');
      expect(callArgs.max_tokens).toBe(16000);
    });

    it('should include system prompt in the API call', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: MOCK_REPORT_JSON },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      await agent.synthesize(MOCK_INTELLIGENCE);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.system).toBeDefined();
      expect(callArgs.system).toContain('agricultural advisor');
    });

    it('should include farmer profile data in the prompt', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: MOCK_REPORT_JSON },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      await agent.synthesize(MOCK_INTELLIGENCE);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      expect(userMessage).toContain('Maharashtra');
      expect(userMessage).toContain('Nagpur');
      expect(userMessage).toContain('borewell');
      expect(userMessage).toContain('3 acres');
    });

    it('should throw on empty text response', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'thinking', thinking: 'Analysis...', signature: 'sig1' },
          // No text block
        ],
        usage: { input_tokens: 5000, output_tokens: 100 },
      });

      await expect(agent.synthesize(MOCK_INTELLIGENCE)).rejects.toThrow('empty text response');
    });

    it('should throw on malformed JSON', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: '{invalid json here}' },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      await expect(agent.synthesize(MOCK_INTELLIGENCE)).rejects.toThrow('malformed JSON');
    });

    it('should throw on no JSON in response', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: 'I recommend planting soybean but cannot format as JSON.' },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      // This will actually try to parse "I recommend..." as JSON since it doesn't match
      // the regex. The regex matches curly braces, so if there are none, it throws.
      // Actually the text has no curly braces so jsonMatch will be null.
      await expect(agent.synthesize(MOCK_INTELLIGENCE)).rejects.toThrow();
    });

    it('should set generatedAt timestamp on the report', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: MOCK_REPORT_JSON },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      const before = new Date().toISOString();
      const report = await agent.synthesize(MOCK_INTELLIGENCE);
      const after = new Date().toISOString();

      expect(report.generatedAt).toBeDefined();
      expect(report.generatedAt! >= before).toBe(true);
      expect(report.generatedAt! <= after).toBe(true);
    });

    it('should handle intelligence with failed MCP servers', async () => {
      const partialIntelligence: AggregatedIntelligence = {
        ...MOCK_INTELLIGENCE,
        soilIntel: makeMCPResponse('mcp-soil-intel', 'error'),
        waterIntel: makeMCPResponse('mcp-water-intel', 'timeout'),
        orchestrationMeta: {
          totalTime_ms: 3000,
          successfulServers: 3,
          failedServers: ['mcp-soil-intel', 'mcp-water-intel'],
          timestamp: new Date().toISOString(),
          hasVisualData: false,
        },
      };

      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: MOCK_REPORT_JSON },
        ],
        usage: { input_tokens: 5000, output_tokens: 2000 },
      });

      const report = await agent.synthesize(partialIntelligence);

      expect(report.primaryRecommendation.crop).toBe('Soybean');

      // Check that the prompt mentions the failures
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      expect(userMessage).toContain('DATA UNAVAILABLE');
      expect(userMessage).toContain('3/5');
    });
  });
});
