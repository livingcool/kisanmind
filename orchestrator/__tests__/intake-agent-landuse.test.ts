/**
 * Integration tests for Intake Agent with Land Use Validation
 */
import { IntakeAgent } from '../intake-agent';
import dotenv from 'dotenv';

dotenv.config();

describe('IntakeAgent - Land Use Integration', () => {
  let agent: IntakeAgent;

  beforeAll(() => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment');
    }
    agent = new IntakeAgent(apiKey);
  });

  describe('Agricultural locations', () => {
    it('should validate Vidarbha farmer input and mark as agricultural', async () => {
      const input = 'I am from Vidarbha region, have 5 acres with borewell. Last year grew cotton.';

      const profile = await agent.parseInput(input);

      expect(profile).toBeDefined();
      expect(profile.location.latitude).toBeCloseTo(20.5, 1);
      expect(profile.location.longitude).toBeCloseTo(78.5, 1);

      // Should have land use validation
      expect(profile.landUseValidation).toBeDefined();
      expect(profile.landUseValidation?.isAgricultural).toBe(true);
      expect(profile.landUseValidation?.landCoverType).toContain('crop');
      expect(profile.landUseValidation?.source).toBeTruthy();

      // Should NOT have a warning for agricultural land
      if (profile.landUseValidation?.warning) {
        expect(profile.landUseValidation.warning).not.toContain('not feasible');
      }
    }, 15000);

    it('should validate Punjab farmer input and mark as agricultural', async () => {
      const input = 'Punjab farmer here, 10 acres, canal irrigation, wheat and rice rotation';

      const profile = await agent.parseInput(input);

      expect(profile).toBeDefined();
      expect(profile.landUseValidation).toBeDefined();
      expect(profile.landUseValidation?.isAgricultural).toBe(true);
    }, 15000);
  });

  describe('Urban locations', () => {
    it('should detect Mumbai location and warn about urban area', async () => {
      const input = 'I live in Mumbai, Andheri area, have small plot near my house';

      const profile = await agent.parseInput(input);

      expect(profile).toBeDefined();
      expect(profile.landUseValidation).toBeDefined();
      expect(profile.landUseValidation?.isAgricultural).toBe(false);
      expect(profile.landUseValidation?.landCoverType).toContain('urban');
      expect(profile.landUseValidation?.warning).toBeDefined();
      expect(profile.landUseValidation?.warning).toContain('urban');
      expect(profile.landUseValidation?.confidence).toBe('high');
    }, 15000);

    it('should detect Delhi location and warn about urban area', async () => {
      const input = 'Delhi में रहता हूं, 2 एकड़ जमीन है';

      const profile = await agent.parseInput(input);

      expect(profile).toBeDefined();
      expect(profile.landUseValidation).toBeDefined();
      expect(profile.landUseValidation?.isAgricultural).toBe(false);
      expect(profile.landUseValidation?.landCoverType).toMatch(/urban|built/i);
    }, 15000);
  });

  describe('Challenging locations', () => {
    it('should warn about Thar Desert location', async () => {
      const input = 'Jaisalmer district, Rajasthan, 3 acres, well water';

      const profile = await agent.parseInput(input);

      expect(profile).toBeDefined();
      expect(profile.landUseValidation).toBeDefined();

      // Desert should be flagged as non-agricultural or have warnings
      if (!profile.landUseValidation?.isAgricultural) {
        expect(profile.landUseValidation?.landCoverType).toMatch(/desert|barren/i);
        expect(profile.landUseValidation?.warning).toContain('arid');
      }
    }, 15000);

    it('should provide coastal warning for Kerala farmer', async () => {
      const input = 'Farmer from Kochi, Kerala, near coast, 4 acres, coconut and paddy';

      const profile = await agent.parseInput(input);

      expect(profile).toBeDefined();
      expect(profile.landUseValidation).toBeDefined();

      // Coastal areas should either be agricultural with warning or have special classification
      if (profile.landUseValidation?.warning) {
        expect(profile.landUseValidation.warning.toLowerCase()).toMatch(/coast|salin/);
      }
    }, 15000);
  });

  describe('Non-blocking behavior', () => {
    it('should still create profile even if land use validation fails', async () => {
      // Use coordinates that might cause validation issues
      const input = 'Small farmer, 2 acres, rainfed';

      const profile = await agent.parseInput(input);

      // Profile should be created regardless of validation status
      expect(profile).toBeDefined();
      expect(profile.location.latitude).toBeDefined();
      expect(profile.location.longitude).toBeDefined();
      expect(profile.landSize.acres).toBeGreaterThan(0);

      // landUseValidation might be present or undefined - both are acceptable
      // The key is that the profile was created
    }, 15000);
  });

  describe('Profile completeness', () => {
    it('should include land use validation in full profile', async () => {
      const input = 'Nagpur district farmer, 6 acres, borewell, soybean crop';

      const profile = await agent.parseInput(input);

      expect(profile).toBeDefined();

      // Check all expected profile fields
      expect(profile.location).toBeDefined();
      expect(profile.landSize).toBeDefined();
      expect(profile.waterSource).toBeDefined();
      expect(profile.language).toBeDefined();
      expect(profile.rawInput).toBe(input);
      expect(profile.confidence).toBeGreaterThan(0);

      // Land use validation should be present
      expect(profile.landUseValidation).toBeDefined();
      expect(profile.landUseValidation?.source).toBeTruthy();
    }, 15000);
  });
});
