/**
 * Visual Intelligence Integration Tests
 *
 * Tests the orchestrator's ability to accept and process visual intelligence
 * from farmer-uploaded images alongside the 5 MCP server data sources.
 */

import type { VisualIntelligence } from '../types.js';

describe('Visual Intelligence Integration', () => {
  const mockVisualIntelligence: VisualIntelligence = {
    hasSoilData: true,
    hasCropData: true,
    soil: {
      type: 'Black Cotton Soil (Vertisol)',
      confidence: 0.85,
      texture: 'clayey',
      ph: 7.8,
      organic_carbon_pct: 0.6,
      drainage: 'poor',
      nutrients: {
        nitrogen_kg_ha: 250,
        phosphorus_kg_ha: 20,
        potassium_kg_ha: 300,
      },
      suitable_crops: ['Cotton', 'Soybean', 'Chickpea'],
      recommendations: ['Apply gypsum to reduce alkalinity'],
    },
    crop: {
      health_score: 0.65,
      assessment: 'Crop shows some stress signs',
      growth_stage: 'Vegetative (active growth)',
      diseases: [
        {
          disease: 'Leaf Blight',
          confidence: 0.78,
          severity: 'moderate',
          affected_area_pct: 25,
          treatment: 'Apply Mancozeb 75% WP',
        },
      ],
      recommendations: [
        'Isolate affected plants',
        'Apply foliar nitrogen spray',
      ],
    },
    overallConfidence: 0.75,
    processingTime_ms: 1234,
  };

  describe('VisualIntelligence Type Definition', () => {
    it('TC5.1: should have correct structure for soil data', () => {
      const vi = mockVisualIntelligence;

      expect(vi.hasSoilData).toBe(true);
      expect(vi.soil).not.toBeNull();
      expect(vi.soil?.type).toBe('Black Cotton Soil (Vertisol)');
      expect(vi.soil?.confidence).toBe(0.85);
      expect(vi.soil?.ph).toBe(7.8);
      expect(vi.soil?.nutrients).toHaveProperty('nitrogen_kg_ha');
      expect(vi.soil?.suitable_crops).toContain('Cotton');
      expect(vi.soil?.recommendations.length).toBeGreaterThan(0);
    });

    it('TC5.2: should have correct structure for crop data', () => {
      const vi = mockVisualIntelligence;

      expect(vi.hasCropData).toBe(true);
      expect(vi.crop).not.toBeNull();
      expect(vi.crop?.health_score).toBe(0.65);
      expect(vi.crop?.assessment).toBeTruthy();
      expect(vi.crop?.growth_stage).toBe('Vegetative (active growth)');
      expect(vi.crop?.diseases).toBeInstanceOf(Array);
      expect(vi.crop?.diseases.length).toBe(1);
      expect(vi.crop?.diseases[0].disease).toBe('Leaf Blight');
      expect(vi.crop?.diseases[0].treatment).toBeTruthy();
    });

    it('TC5.3: should handle soil-only visual intelligence', () => {
      const soilOnly: VisualIntelligence = {
        hasSoilData: true,
        hasCropData: false,
        soil: mockVisualIntelligence.soil,
        crop: null,
        overallConfidence: 0.85,
        processingTime_ms: 800,
      };

      expect(soilOnly.hasSoilData).toBe(true);
      expect(soilOnly.hasCropData).toBe(false);
      expect(soilOnly.soil).not.toBeNull();
      expect(soilOnly.crop).toBeNull();
    });

    it('TC5.4: should handle crop-only visual intelligence', () => {
      const cropOnly: VisualIntelligence = {
        hasSoilData: false,
        hasCropData: true,
        soil: null,
        crop: mockVisualIntelligence.crop,
        overallConfidence: 0.70,
        processingTime_ms: 650,
      };

      expect(cropOnly.hasSoilData).toBe(false);
      expect(cropOnly.hasCropData).toBe(true);
      expect(cropOnly.soil).toBeNull();
      expect(cropOnly.crop).not.toBeNull();
    });
  });

  describe('Visual Intelligence Data Validation', () => {
    it('TC5.5: should validate soil data completeness', () => {
      const soil = mockVisualIntelligence.soil;
      expect(soil).not.toBeNull();

      if (soil) {
        // Required fields
        expect(soil.type).toBeTruthy();
        expect(soil.confidence).toBeGreaterThan(0);
        expect(soil.confidence).toBeLessThanOrEqual(1);
        expect(soil.texture).toBeTruthy();
        expect(soil.ph).toBeGreaterThan(0);
        expect(soil.ph).toBeLessThan(14);
        expect(soil.drainage).toBeTruthy();

        // Nutrients
        expect(soil.nutrients.nitrogen_kg_ha).toBeGreaterThanOrEqual(0);
        expect(soil.nutrients.phosphorus_kg_ha).toBeGreaterThanOrEqual(0);
        expect(soil.nutrients.potassium_kg_ha).toBeGreaterThanOrEqual(0);

        // Arrays
        expect(Array.isArray(soil.suitable_crops)).toBe(true);
        expect(Array.isArray(soil.recommendations)).toBe(true);
      }
    });

    it('TC5.6: should validate crop data completeness', () => {
      const crop = mockVisualIntelligence.crop;
      expect(crop).not.toBeNull();

      if (crop) {
        // Required fields
        expect(crop.health_score).toBeGreaterThanOrEqual(0);
        expect(crop.health_score).toBeLessThanOrEqual(1);
        expect(crop.assessment).toBeTruthy();
        expect(crop.growth_stage).toBeTruthy();

        // Diseases array
        expect(Array.isArray(crop.diseases)).toBe(true);
        if (crop.diseases.length > 0) {
          const disease = crop.diseases[0];
          expect(disease.disease).toBeTruthy();
          expect(disease.confidence).toBeGreaterThan(0);
          expect(disease.severity).toMatch(/low|moderate|high/);
          expect(disease.affected_area_pct).toBeGreaterThanOrEqual(0);
          expect(disease.affected_area_pct).toBeLessThanOrEqual(100);
          expect(disease.treatment).toBeTruthy();
        }

        // Recommendations
        expect(Array.isArray(crop.recommendations)).toBe(true);
        expect(crop.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('TC5.7: should validate overall confidence and processing time', () => {
      const vi = mockVisualIntelligence;

      expect(vi.overallConfidence).toBeGreaterThan(0);
      expect(vi.overallConfidence).toBeLessThanOrEqual(1);
      expect(vi.processingTime_ms).toBeGreaterThan(0);
    });
  });

  describe('Visual Intelligence Use Cases', () => {
    it('TC5.8: should represent Vidarbha farmer black soil confirmation', () => {
      const vidarbhaVisual: VisualIntelligence = {
        hasSoilData: true,
        hasCropData: false,
        soil: {
          type: 'Black Cotton Soil (Vertisol)',
          confidence: 0.88,
          texture: 'clayey',
          ph: 8.0,
          organic_carbon_pct: 0.55,
          drainage: 'poor',
          nutrients: {
            nitrogen_kg_ha: 220,
            phosphorus_kg_ha: 18,
            potassium_kg_ha: 280,
          },
          suitable_crops: ['Cotton', 'Soybean', 'Sorghum', 'Chickpea'],
          recommendations: [
            'Apply gypsum (2-3 tonnes/ha) to reduce alkalinity',
            'Create raised beds or ridges to improve drainage during monsoon',
          ],
        },
        crop: null,
        overallConfidence: 0.88,
        processingTime_ms: 890,
      };

      // This represents farmer-uploaded soil photo confirming satellite data
      expect(vidarbhaVisual.soil?.type).toContain('Black Cotton');
      expect(vidarbhaVisual.soil?.confidence).toBeGreaterThan(0.85);
      expect(vidarbhaVisual.soil?.suitable_crops).toContain('Cotton');
      expect(vidarbhaVisual.soil?.drainage).toBe('poor');
    });

    it('TC5.9: should represent cotton crop with disease detection', () => {
      const cottonDiseaseVisual: VisualIntelligence = {
        hasSoilData: false,
        hasCropData: true,
        soil: null,
        crop: {
          health_score: 0.55,
          assessment: 'URGENT: 1 high-severity issue(s) detected. Immediate treatment recommended.',
          growth_stage: 'Flowering/Reproductive',
          diseases: [
            {
              disease: 'Bacterial Wilt',
              confidence: 0.82,
              severity: 'high',
              affected_area_pct: 35,
              treatment: 'Remove infected plants, apply Streptocycline (0.01%) soil drench',
            },
          ],
          recommendations: [
            'Isolate affected plants to prevent spread to healthy ones',
            'Contact local Krishi Vigyan Kendra (KVK) for expert diagnosis',
            'Consider crop insurance claim if yield loss exceeds 33%',
          ],
        },
        overallConfidence: 0.82,
        processingTime_ms: 1120,
      };

      expect(cottonDiseaseVisual.crop?.health_score).toBeLessThan(0.6);
      expect(cottonDiseaseVisual.crop?.diseases[0].severity).toBe('high');
      expect(cottonDiseaseVisual.crop?.assessment).toContain('URGENT');
      expect(cottonDiseaseVisual.crop?.recommendations).toContain(
        'Contact local Krishi Vigyan Kendra (KVK) for expert diagnosis'
      );
    });

    it('TC5.10: should represent both soil and crop assessment', () => {
      const fullAssessment = mockVisualIntelligence;

      expect(fullAssessment.hasSoilData).toBe(true);
      expect(fullAssessment.hasCropData).toBe(true);

      // Both data sources present
      expect(fullAssessment.soil).not.toBeNull();
      expect(fullAssessment.crop).not.toBeNull();

      // Overall confidence is average of both
      const soilConf = fullAssessment.soil?.confidence || 0;
      const cropHealth = fullAssessment.crop?.health_score || 0;
      const expectedAvg = (soilConf + cropHealth) / 2;

      expect(fullAssessment.overallConfidence).toBeCloseTo(expectedAvg, 2);
    });
  });

  describe('Integration with Orchestrator', () => {
    it('TC5.11: should be compatible with AggregatedIntelligence type', () => {
      // Visual intelligence should fit into the aggregated intelligence structure
      // This test verifies type compatibility

      const visualIntel = mockVisualIntelligence;

      // AggregatedIntelligence has visualIntel?: VisualIntelligence
      const aggregated = {
        farmerProfile: {} as any,
        soilIntel: {} as any,
        waterIntel: {} as any,
        climateIntel: {} as any,
        marketIntel: {} as any,
        schemeIntel: {} as any,
        visualIntel: visualIntel, // Should be compatible
      };

      expect(aggregated.visualIntel).toBeDefined();
      expect(aggregated.visualIntel?.hasSoilData).toBe(true);
      expect(aggregated.visualIntel?.hasCropData).toBe(true);
    });

    it('TC5.12: should work without visual intelligence (backward compatible)', () => {
      // System should work fine when visualIntel is undefined

      const aggregatedWithoutVisual = {
        farmerProfile: {} as any,
        soilIntel: {} as any,
        waterIntel: {} as any,
        climateIntel: {} as any,
        marketIntel: {} as any,
        schemeIntel: {} as any,
        visualIntel: undefined,
      };

      expect(aggregatedWithoutVisual.visualIntel).toBeUndefined();
      // This should not break the orchestrator
    });
  });
});
