/**
 * Synthesis Agent - Generates final farming decision report
 * Uses Claude Opus 4.6 with EXTENDED THINKING enabled
 *
 * This is the brain of KisanMind - it takes data from all 5 MCP servers
 * and synthesizes it into actionable, profit-optimized farming recommendations.
 *
 * Extended thinking allows the model to reason deeply about trade-offs between
 * soil suitability, water constraints, climate risks, market demand, and subsidies.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { AggregatedIntelligence, FarmingDecisionReport } from './types.js';

const SYNTHESIS_SYSTEM_PROMPT = `You are an expert agricultural advisor for Indian farmers. You analyze complex, multi-dimensional farming data and generate clear, actionable, profit-optimized recommendations.

Your goal: Help farmers maximize profit while minimizing risk.

You will receive data from 5 sources:
1. Soil intelligence (pH, texture, nutrients, crop suitability)
2. Water intelligence (quality, availability, salinity, groundwater status)
3. Climate intelligence (rainfall forecasts, temperature, drought risk)
4. Market intelligence (crop prices, trends, nearby mandis)
5. Government scheme intelligence (eligible subsidies, insurance, schemes)

Some data sources may have failed (status: "error" or "timeout"). Work with whatever data is available - never refuse to give advice because one source is missing.

Your task: Synthesize this data into ONE clear recommendation that answers: "What should I plant this season to make the most money?"

CRITICAL REQUIREMENTS:
1. **Profit-focused**: Lead with expected profit per acre, not generic advice
2. **Specific**: Recommend ONE primary crop with exact variety and sowing date
3. **Actionable**: Provide month-by-month action plan with exact steps
4. **Risk-aware**: Identify top 3 risks and concrete mitigation strategies
5. **Scheme-integrated**: Tell farmers EXACTLY which schemes to apply for and HOW
6. **Market-timed**: Tell farmers WHERE and WHEN to sell for maximum profit

OUTPUT FORMAT (JSON):
{
  "summary": "<2-3 sentence executive summary: what to plant, expected profit, why>",
  "primaryRecommendation": {
    "crop": "<crop name>",
    "variety": "<specific variety name>",
    "expectedProfit_per_acre": <number in INR>,
    "sowingDate": "<exact date or date range>",
    "confidence": "<high/medium/low>"
  },
  "alternativeOptions": [
    {
      "crop": "<crop name>",
      "expectedProfit_per_acre": <number>,
      "reason": "<why this is alternative>"
    }
  ],
  "waterStrategy": {
    "irrigationMethod": "<drip/sprinkler/flood>",
    "waterSchedule": "<when and how much>",
    "waterSavingTips": ["<tip1>", "<tip2>"]
  },
  "marketStrategy": {
    "bestSellingTime": "<month/season>",
    "bestMarket": "<specific mandi name>",
    "expectedPrice": "<INR per quintal>",
    "storageAdvice": "<how long can you store>"
  },
  "governmentSupport": {
    "schemesToApply": [
      {
        "name": "<scheme name>",
        "benefit": "<what you get>",
        "howToApply": "<exact steps>",
        "deadline": "<when to apply>"
      }
    ],
    "totalBenefit": "<total INR benefit from all schemes>"
  },
  "riskAssessment": [
    {
      "risk": "<risk description>",
      "severity": "<high/medium/low>",
      "mitigation": "<what to do>"
    }
  ],
  "monthlyActionPlan": [
    {
      "month": "<month name>",
      "actions": ["<action1>", "<action2>"]
    }
  ],
  "disclaimer": "Verify government scheme eligibility with local agriculture office. Prices are estimates based on current trends.",
  "language": "<detected language from farmer input>"
}

REASONING APPROACH:
1. **Soil + Water -> Feasible crops**: Which crops can physically grow here?
2. **Climate -> Risk adjustment**: Which crops can survive the forecasted weather?
3. **Market -> Profit ranking**: Of feasible crops, which makes most money?
4. **Schemes -> Cost reduction**: What subsidies reduce input costs?
5. **Final calculation**: Expected revenue - costs + subsidies = net profit

Think deeply about trade-offs. Extended thinking is enabled - use it to reason through conflicts between datasets.`;

export class SynthesisAgent {
  private client: Anthropic;
  private model: string;
  private extendedThinkingBudget: number;

  constructor(apiKey: string, model: string = 'claude-opus-4-6-20250514', extendedThinkingBudget: number = 10000) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.extendedThinkingBudget = extendedThinkingBudget;
  }

  /**
   * Synthesize all intelligence into a final farming decision report.
   *
   * Uses Claude Opus 4.6 with extended thinking enabled. The thinking budget
   * allows the model to reason through multi-factor trade-offs before
   * producing the final structured recommendation.
   */
  async synthesize(intelligence: AggregatedIntelligence): Promise<FarmingDecisionReport> {
    const startTime = Date.now();
    console.log('[SynthesisAgent] Starting synthesis with Claude Opus 4.6 + Extended Thinking...');
    console.log(`[SynthesisAgent] Model: ${this.model}, Thinking budget: ${this.extendedThinkingBudget} tokens`);
    console.log(`[SynthesisAgent] Data sources: ${intelligence.orchestrationMeta.successfulServers}/5 successful, failed: [${intelligence.orchestrationMeta.failedServers.join(', ')}]`);

    try {
      const userPrompt = this.buildPrompt(intelligence);

      // Extended thinking requires temperature to not be set (or set to 1).
      // The system prompt is passed as a top-level parameter.
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 16000,
        thinking: {
          type: 'enabled',
          budget_tokens: this.extendedThinkingBudget,
        },
        // Note: when extended thinking is enabled, temperature must be 1 (the default)
        system: SYNTHESIS_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract thinking and text blocks using proper type narrowing
      let thinkingTokensUsed = 0;
      const thinkingTexts: string[] = [];
      const textParts: string[] = [];

      for (const block of response.content) {
        if (block.type === 'thinking') {
          thinkingTexts.push(block.thinking);
          thinkingTokensUsed++;
        } else if (block.type === 'text') {
          textParts.push(block.text);
        }
        // Ignore redacted_thinking, tool_use, etc.
      }

      if (thinkingTokensUsed > 0) {
        console.log(`[SynthesisAgent] Extended thinking used ${thinkingTokensUsed} thinking block(s)`);
        // Log a summary of thinking (first 200 chars) for debugging
        const thinkingSummary = thinkingTexts[0]?.substring(0, 200) ?? '';
        console.log(`[SynthesisAgent] Thinking preview: ${thinkingSummary}...`);
      } else {
        console.warn('[SynthesisAgent] WARNING: No thinking blocks in response - extended thinking may not have engaged');
      }

      const responseText = textParts.join('');

      if (!responseText) {
        throw new Error('SynthesisAgent received empty text response from Claude');
      }

      // Parse JSON response - handle markdown code blocks and bare JSON
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        responseText.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        console.error('[SynthesisAgent] Failed to extract JSON. Response text:', responseText.substring(0, 500));
        throw new Error('SynthesisAgent did not return valid JSON in response');
      }

      const jsonStr = jsonMatch[1] ?? jsonMatch[0];
      let report: FarmingDecisionReport;

      try {
        report = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('[SynthesisAgent] JSON parse error. Extracted JSON:', jsonStr.substring(0, 500));
        throw new Error(`SynthesisAgent returned malformed JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }

      // Ensure required fields with defaults
      report.generatedAt = new Date().toISOString();
      report.language = report.language ?? intelligence.farmerProfile.language ?? 'English';
      report.disclaimer = report.disclaimer ?? 'Verify government scheme eligibility with local agriculture office. Prices are estimates based on current trends.';

      const elapsed = Date.now() - startTime;
      console.log(`[SynthesisAgent] Report generated in ${elapsed}ms`);
      console.log(`[SynthesisAgent] Primary recommendation: ${report.primaryRecommendation.crop} (${report.primaryRecommendation.variety})`);
      console.log(`[SynthesisAgent] Expected profit: INR ${report.primaryRecommendation.expectedProfit_per_acre}/acre`);
      console.log(`[SynthesisAgent] Confidence: ${report.primaryRecommendation.confidence}`);
      console.log(`[SynthesisAgent] Usage: input=${response.usage.input_tokens}, output=${response.usage.output_tokens}`);

      return report;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[SynthesisAgent] Synthesis failed after ${elapsed}ms:`, error);

      // Attempt to provide a degraded response if the API error is transient
      if (error instanceof Anthropic.APIError) {
        console.error(`[SynthesisAgent] API Error: status=${error.status}, message=${error.message}`);
        if (error.status === 529 || error.status === 503) {
          console.error('[SynthesisAgent] API overloaded - consider retry with backoff');
        }
      }

      throw error;
    }
  }

  /**
   * Build the synthesis prompt from aggregated intelligence.
   *
   * Structures data from all 5 MCP servers into a clear prompt that
   * the synthesis model can reason about. Handles partial data gracefully
   * by clearly marking which data sources succeeded or failed.
   */
  private buildPrompt(intelligence: AggregatedIntelligence): string {
    const { farmerProfile, soilIntel, waterIntel, climateIntel, marketIntel, schemeIntel } = intelligence;

    const formatData = (data: unknown, status: string): string => {
      if (status === 'error' || status === 'timeout') {
        return `DATA UNAVAILABLE (${status}). Use your knowledge of Indian farming to provide reasonable estimates.`;
      }
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return 'Data available but could not be serialized. Use defaults.';
      }
    };

    return `# Farmer Profile
Location: ${farmerProfile.location.state}, ${farmerProfile.location.district}${farmerProfile.location.village ? ', ' + farmerProfile.location.village : ''}
Coordinates: ${farmerProfile.location.latitude}N, ${farmerProfile.location.longitude}E
Land Size: ${farmerProfile.landSize.acres} acres${farmerProfile.landSize.irrigated_acres ? ` (${farmerProfile.landSize.irrigated_acres} irrigated)` : ''}
Water Source: ${farmerProfile.waterSource}
Current Crops: ${farmerProfile.currentCrops.length > 0 ? farmerProfile.currentCrops.join(', ') : 'None'}
Previous Crops: ${farmerProfile.previousCrops.length > 0 ? farmerProfile.previousCrops.join(', ') : 'Unknown'}
Budget: ${farmerProfile.budget_INR ? `INR ${farmerProfile.budget_INR}` : 'Not specified'}
Language: ${farmerProfile.language}

# Data Quality Summary
Successful data sources: ${intelligence.orchestrationMeta.successfulServers}/5
Failed sources: ${intelligence.orchestrationMeta.failedServers.length > 0 ? intelligence.orchestrationMeta.failedServers.join(', ') : 'None'}
Total data collection time: ${intelligence.orchestrationMeta.totalTime_ms}ms

# Soil Intelligence (${soilIntel.status}, ${soilIntel.responseTime_ms}ms)
${formatData(soilIntel.data, soilIntel.status)}

# Water Intelligence (${waterIntel.status}, ${waterIntel.responseTime_ms}ms)
${formatData(waterIntel.data, waterIntel.status)}

# Climate Intelligence (${climateIntel.status}, ${climateIntel.responseTime_ms}ms)
${formatData(climateIntel.data, climateIntel.status)}

# Market Intelligence (${marketIntel.status}, ${marketIntel.responseTime_ms}ms)
${formatData(marketIntel.data, marketIntel.status)}

# Government Scheme Intelligence (${schemeIntel.status}, ${schemeIntel.responseTime_ms}ms)
${formatData(schemeIntel.data, schemeIntel.status)}

# Your Task
Using the above data, generate a comprehensive farming decision report that tells this farmer EXACTLY what to plant this season to maximize profit.

Focus on:
1. Profit per acre (most important metric)
2. Risk mitigation (especially for failed crops: ${farmerProfile.previousCrops.join(', ') || 'none reported'})
3. Water efficiency (source: ${farmerProfile.waterSource})
4. Government subsidies (reduce costs)
5. Market timing (sell when prices peak)

Return ONLY valid JSON in the specified format. Do NOT wrap it in markdown code blocks.`;
  }
}
