/**
 * Tests for the Intake Agent
 *
 * Tests the parsing logic and fallback behavior.
 * Uses mocks for the Anthropic API.
 */

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

import { IntakeAgent } from '../intake-agent.js';
import Anthropic from '@anthropic-ai/sdk';

describe('IntakeAgent', () => {
  let agent: IntakeAgent;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new IntakeAgent('test-api-key');
    // Access the mock
    const clientInstance = (Anthropic as unknown as jest.Mock).mock.results[0]?.value;
    mockCreate = clientInstance?.messages?.create;
  });

  function mockAPIResponse(jsonText: string) {
    mockCreate.mockResolvedValue({
      content: [
        { type: 'text', text: jsonText },
      ],
      usage: { input_tokens: 100, output_tokens: 200 },
    });
  }

  describe('parseInput()', () => {
    it('should extract a valid profile from well-formed JSON response', async () => {
      mockAPIResponse(JSON.stringify({
        location: {
          latitude: 20.5,
          longitude: 78.5,
          state: 'Maharashtra',
          district: 'Nagpur',
          village: null,
        },
        landSize: { acres: 3, irrigated_acres: 2 },
        waterSource: 'borewell',
        currentCrops: ['cotton'],
        previousCrops: ['soybean'],
        budget_INR: 50000,
        farmingExperience: '10 years',
        soilType: 'black soil',
        language: 'English',
        confidence: 0.85,
      }));

      const profile = await agent.parseInput('I am a farmer from Vidarbha with 3 acres');

      expect(profile.location.state).toBe('Maharashtra');
      expect(profile.location.latitude).toBe(20.5);
      expect(profile.landSize.acres).toBe(3);
      expect(profile.waterSource).toBe('borewell');
      expect(profile.currentCrops).toEqual(['cotton']);
      expect(profile.budget_INR).toBe(50000);
      expect(profile.confidence).toBe(0.85);
      expect(profile.rawInput).toBe('I am a farmer from Vidarbha with 3 acres');
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      mockAPIResponse('```json\n{"location":{"latitude":20.5,"longitude":78.5,"state":"Maharashtra","district":"Nagpur","village":null},"landSize":{"acres":5},"waterSource":"canal","currentCrops":[],"previousCrops":[],"language":"Hindi","confidence":0.7}\n```');

      const profile = await agent.parseInput('Test input');

      expect(profile.location.state).toBe('Maharashtra');
      expect(profile.landSize.acres).toBe(5);
      expect(profile.waterSource).toBe('canal');
    });

    it('should use defaults for missing fields', async () => {
      mockAPIResponse(JSON.stringify({
        location: {
          latitude: 21.0,
          longitude: 79.0,
          state: 'Maharashtra',
          district: 'Amravati',
        },
        language: 'Hindi',
        confidence: 0.5,
      }));

      const profile = await agent.parseInput('Minimal input');

      expect(profile.landSize.acres).toBe(3); // default
      expect(profile.waterSource).toBe('borewell'); // default
      expect(profile.currentCrops).toEqual([]); // default
      expect(profile.previousCrops).toEqual([]); // default
    });

    it('should return a default profile when API call fails', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      const profile = await agent.parseInput('Some input');

      expect(profile.location.state).toBe('Maharashtra');
      expect(profile.location.district).toBe('Nagpur');
      expect(profile.confidence).toBe(0.1); // Low confidence for fallback
      expect(profile.rawInput).toBe('Some input');
    });

    it('should return a default profile when response has no JSON', async () => {
      mockAPIResponse('I could not parse the input properly. Please try again.');

      const profile = await agent.parseInput('Gibberish input');

      expect(profile.confidence).toBe(0.1);
      expect(profile.location.state).toBe('Maharashtra');
    });

    it('should preserve the raw input in the profile', async () => {
      mockAPIResponse(JSON.stringify({
        location: { latitude: 20.5, longitude: 78.5, state: 'Maharashtra', district: 'Test' },
        language: 'English',
        confidence: 0.9,
      }));

      const rawInput = 'Main Vidarbha se hoon, mere paas 5 bigha zameen hai';
      const profile = await agent.parseInput(rawInput);

      expect(profile.rawInput).toBe(rawInput);
    });

    it('should handle non-numeric values gracefully', async () => {
      mockAPIResponse(JSON.stringify({
        location: {
          latitude: 'twenty',
          longitude: 78.5,
          state: 'Maharashtra',
          district: 'Test',
        },
        landSize: { acres: 'three' },
        confidence: 'high',
      }));

      const profile = await agent.parseInput('Test');

      // Non-numeric latitude should fall back to default
      expect(profile.location.latitude).toBe(20.5);
      expect(profile.landSize.acres).toBe(3);
      expect(profile.confidence).toBe(0.5);
    });
  });
});
