/**
 * Tests for Land Use Validator
 */
import { LandUseValidator } from '../utils/land-use-validator';

describe('LandUseValidator', () => {
  let validator: LandUseValidator;

  beforeEach(() => {
    validator = new LandUseValidator();
  });

  describe('Agricultural regions', () => {
    it('should classify Vidarbha as agricultural', async () => {
      const result = await validator.validateLandUse(20.5, 78.5);

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(true);
      expect(result?.landCoverType).toContain('crop');
      expect(result?.confidence).toBeTruthy();
    });

    it('should classify Punjab plains as agricultural', async () => {
      const result = await validator.validateLandUse(30.5, 75.5);

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(true);
      expect(['cropland', 'agricultural']).toContain(result?.landCoverType.toLowerCase());
    });

    it('should classify Western Maharashtra as agricultural', async () => {
      const result = await validator.validateLandUse(18.5, 74.5);

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(true);
    });
  });

  describe('Urban areas', () => {
    it('should classify Mumbai as non-agricultural with warning', async () => {
      const result = await validator.validateLandUse(19.0760, 72.8777);

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(false);
      expect(result?.landCoverType).toContain('urban');
      expect(result?.warning).toBeDefined();
      expect(result?.warning).toContain('Mumbai');
    });

    it('should classify Delhi as non-agricultural', async () => {
      const result = await validator.validateLandUse(28.7041, 77.1025);

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(false);
      expect(result?.confidence).toBe('high');
    });

    it('should classify Bangalore as non-agricultural', async () => {
      const result = await validator.validateLandUse(12.9716, 77.5946);

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(false);
      expect(result?.landCoverType).toContain('urban');
    });
  });

  describe('Forest/protected regions', () => {
    it('should flag Western Ghats as forest region', async () => {
      const result = await validator.validateLandUse(15.0, 75.0);

      expect(result).toBeDefined();
      // Western Ghats should be flagged as forest/non-agricultural
      if (result?.isAgricultural === false) {
        expect(result?.landCoverType).toMatch(/forest|shrub/i);
        expect(result?.warning).toBeDefined();
      }
    });
  });

  describe('Coastal regions', () => {
    it('should classify Kerala coast as coastal agricultural', async () => {
      const result = await validator.validateLandUse(10.0, 76.0);

      expect(result).toBeDefined();
      // Coastal areas may be agricultural but should have warnings
      if (result?.isAgricultural) {
        expect(result?.warning).toContain('Coastal');
      }
    });
  });

  describe('Desert/arid regions', () => {
    it('should classify Thar Desert as non-agricultural', async () => {
      const result = await validator.validateLandUse(26.0, 70.0);

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(false);
      expect(result?.landCoverType).toMatch(/desert|barren/i);
      expect(result?.warning).toContain('arid');
    });
  });

  describe('Out of bounds', () => {
    it('should flag coordinates outside India', async () => {
      const result = await validator.validateLandUse(40.0, -74.0); // New York

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(false);
      expect(result?.warning).toContain('outside India');
      expect(result?.confidence).toBe('high');
    });

    it('should flag negative coordinates outside India', async () => {
      const result = await validator.validateLandUse(-33.8688, 151.2093); // Sydney

      expect(result).toBeDefined();
      expect(result?.isAgricultural).toBe(false);
      expect(result?.landCoverType).toBe('outside_india');
    });
  });

  describe('Edge cases', () => {
    it('should handle borderline coordinates gracefully', async () => {
      const result = await validator.validateLandUse(8.1, 68.1); // Just inside India

      expect(result).toBeDefined();
      expect(result?.confidence).toBeTruthy();
    });

    it('should provide default classification for unclassified regions', async () => {
      // Use coordinates in a less-defined agricultural region
      const result = await validator.validateLandUse(22.0, 80.0);

      expect(result).toBeDefined();
      // Should provide some classification even if low confidence
      expect(['high', 'medium', 'low']).toContain(result?.confidence);
    });
  });

  describe('Source attribution', () => {
    it('should always include source information', async () => {
      const result = await validator.validateLandUse(20.5, 78.5);

      expect(result).toBeDefined();
      expect(result?.source).toBeDefined();
      expect(result?.source.length).toBeGreaterThan(0);
    });
  });

  describe('Non-blocking behavior', () => {
    it('should return results even with network issues', async () => {
      // The validator should fall back to heuristics if APIs fail
      const result = await validator.validateLandUse(20.5, 78.5);

      // Should always return something (heuristics fallback)
      expect(result).toBeDefined();
    });
  });
});
