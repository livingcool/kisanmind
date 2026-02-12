/**
 * Intake Agent - Parses farmer input (text/voice) using Claude Haiku 4.5
 *
 * Extracts structured farmer profile from natural language input including:
 * - Location (coordinates, state, district)
 * - Land size and irrigation status
 * - Water source
 * - Current and previous crops
 * - Budget constraints
 * - Preferred language
 *
 * Designed to handle:
 * - Multiple Indian languages (Hindi, Marathi, Tamil, Telugu, English)
 * - Informal/colloquial input
 * - Partial information (fills in sensible defaults)
 * - Voice-to-text artifacts (missing punctuation, recognition errors)
 */
import Anthropic from '@anthropic-ai/sdk';
import type { FarmerProfile } from './types.js';

const INTAKE_SYSTEM_PROMPT = `You are an agricultural intake specialist for KisanMind, an AI farming advisor for Indian farmers.

Your job is to extract a structured farmer profile from the farmer's input. The farmer may speak in Hindi, Marathi, Tamil, Telugu, or English. They may be brief or detailed.

Extract the following information. If something is not mentioned, use reasonable defaults for Indian farming context:

1. **Location**: Extract village, district, state. Convert to approximate latitude/longitude.
   - If they mention a region (e.g., "Vidarbha"), map to center coordinates
   - Common regions: Vidarbha (20.5, 78.5), Marathwada (19.0, 76.5), Western Maharashtra (18.5, 74.0), Punjab (30.5, 75.5), etc.

2. **Land Size**: In acres. Indians often say "bigha" (1 bigha = 0.6 acres in most states) or "hectare" (1 ha = 2.47 acres)

3. **Water Source**: borewell, well, canal, rain-fed, river, tank

4. **Crops**: Current season crop and previous crops grown

5. **Budget**: If mentioned, in INR

6. **Language**: Detect the language of input

RESPOND ONLY WITH A VALID JSON OBJECT in this exact format:
{
  "location": {
    "latitude": <number>,
    "longitude": <number>,
    "state": "<string>",
    "district": "<string>",
    "village": "<string or null>"
  },
  "landSize": {
    "acres": <number>,
    "irrigated_acres": <number or null>
  },
  "waterSource": "<string>",
  "currentCrops": ["<crop1>", "<crop2>"],
  "previousCrops": ["<crop1>"],
  "budget_INR": <number or null>,
  "farmingExperience": "<string or null>",
  "soilType": "<string or null>",
  "language": "<detected language>",
  "confidence": <0.0-1.0 how confident you are in the extraction>
}

Important:
- Always provide latitude/longitude even if approximate
- Default land size to 3 acres if not mentioned
- Default water source to "borewell" if not mentioned
- Be generous in interpretation - farmers may use informal language
- If the input is very vague, set confidence low and use sensible defaults for Maharashtra, India`;

export class IntakeAgent {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-haiku-4-5-20250315') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  /**
   * Parse farmer input into a structured profile.
   *
   * Uses Claude Haiku 4.5 for fast, cost-effective extraction.
   * Returns a FarmerProfile even on partial failures by using sensible defaults.
   */
  async parseInput(farmerInput: string): Promise<FarmerProfile> {
    const startTime = Date.now();
    console.log(`[IntakeAgent] Parsing farmer input (${farmerInput.length} chars) with model ${this.model}...`);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        temperature: 0.2, // Low temperature for structured extraction
        system: INTAKE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Parse this farmer's input and extract their profile:\n\n"${farmerInput}"`,
          },
        ],
      });

      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        responseText.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        console.error('[IntakeAgent] No JSON found in response:', responseText.substring(0, 300));
        throw new Error('IntakeAgent did not return valid JSON');
      }

      const jsonStr = jsonMatch[1] ?? jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      const profile = this.buildProfile(parsed, farmerInput);

      const elapsed = Date.now() - startTime;
      console.log(`[IntakeAgent] Profile extracted in ${elapsed}ms (confidence: ${profile.confidence})`);
      console.log(`[IntakeAgent] Location: ${profile.location.state}, ${profile.location.district} (${profile.location.latitude}, ${profile.location.longitude})`);
      console.log(`[IntakeAgent] Land: ${profile.landSize.acres} acres, Water: ${profile.waterSource}, Crops: [${profile.currentCrops.join(', ')}]`);
      console.log(`[IntakeAgent] Usage: input=${response.usage.input_tokens}, output=${response.usage.output_tokens}`);

      return profile;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[IntakeAgent] Error parsing input after ${elapsed}ms:`, error);

      // Return a default profile so the pipeline can continue.
      // The synthesis agent will work with whatever MCP data comes back.
      console.warn('[IntakeAgent] Returning default Vidarbha profile as fallback');
      return this.getDefaultProfile(farmerInput);
    }
  }

  /**
   * Build a validated FarmerProfile from parsed JSON.
   * Applies defaults for any missing fields.
   */
  private buildProfile(parsed: Record<string, unknown>, rawInput: string): FarmerProfile {
    const location = parsed.location as Record<string, unknown> | undefined;
    const landSize = parsed.landSize as Record<string, unknown> | undefined;

    return {
      location: {
        latitude: this.toNumber(location?.latitude, 20.5),
        longitude: this.toNumber(location?.longitude, 78.5),
        state: this.toString(location?.state, 'Maharashtra'),
        district: this.toString(location?.district, 'Unknown'),
        village: location?.village != null ? String(location.village) : undefined,
      },
      landSize: {
        acres: this.toNumber(landSize?.acres, 3),
        irrigated_acres: landSize?.irrigated_acres != null
          ? this.toNumber(landSize.irrigated_acres, undefined)
          : undefined,
      },
      waterSource: this.toString(parsed.waterSource, 'borewell'),
      currentCrops: this.toStringArray(parsed.currentCrops),
      previousCrops: this.toStringArray(parsed.previousCrops),
      budget_INR: parsed.budget_INR != null ? this.toNumber(parsed.budget_INR, undefined) : undefined,
      farmingExperience: parsed.farmingExperience != null ? String(parsed.farmingExperience) : undefined,
      soilType: parsed.soilType != null ? String(parsed.soilType) : undefined,
      language: this.toString(parsed.language, 'English'),
      rawInput,
      confidence: this.toNumber(parsed.confidence, 0.5),
    };
  }

  /**
   * Default profile for Vidarbha region when parsing fails completely.
   */
  private getDefaultProfile(rawInput: string): FarmerProfile {
    return {
      location: {
        latitude: 20.5,
        longitude: 78.5,
        state: 'Maharashtra',
        district: 'Nagpur',
      },
      landSize: { acres: 3 },
      waterSource: 'borewell',
      currentCrops: [],
      previousCrops: [],
      language: 'English',
      rawInput,
      confidence: 0.1,
    };
  }

  /**
   * Safe number coercion with default
   */
  private toNumber(value: unknown, fallback: number): number;
  private toNumber(value: unknown, fallback: undefined): number | undefined;
  private toNumber(value: unknown, fallback: number | undefined): number | undefined {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  }

  /**
   * Safe string coercion with default
   */
  private toString(value: unknown, fallback: string): string {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  }

  /**
   * Safe array coercion
   */
  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter(item => item != null).map(item => String(item));
  }
}
