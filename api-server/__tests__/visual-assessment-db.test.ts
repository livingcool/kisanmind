/**
 * Database Tests for Visual Assessment Storage
 *
 * Tests the in-memory database operations for storing and retrieving
 * visual assessment results. These tests verify CRUD operations,
 * session indexing, cleanup, and type conversions.
 */

import {
  storeAssessment,
  getAssessment,
  getSessionAssessments,
  getLatestAssessment,
  toVisualIntelligence,
  cleanupOldAssessments,
  type VisualAssessment,
  type SoilAnalysisResult,
  type CropAnalysisResult,
} from '../../api-server/visual-assessment-db.js';

describe('Visual Assessment Database', () => {
  // Mock assessment data
  const mockSoilAnalysis: SoilAnalysisResult = {
    soil_type: 'Black Cotton Soil (Vertisol)',
    soil_description: 'Deep black soil rich in clay',
    confidence: 0.85,
    texture: 'clayey',
    estimated_ph: 7.8,
    organic_carbon_pct: 0.6,
    drainage: 'poor',
    nutrients: {
      nitrogen_kg_ha: 250,
      phosphorus_kg_ha: 20,
      potassium_kg_ha: 300,
    },
    suitable_crops: ['Cotton', 'Soybean', 'Chickpea'],
    common_regions: ['Vidarbha', 'Marathwada'],
    recommendations: ['Apply gypsum to reduce alkalinity'],
    image_analysis: {
      brightness: 45.2,
      redness_index: 0.35,
      greenness_index: 0.33,
      texture_variance: 52.1,
      saturation: 0.15,
    },
  };

  const mockCropAnalysis: CropAnalysisResult = {
    health_score: 0.65,
    assessment: 'Crop shows some stress signs',
    growth_stage: 'Vegetative (active growth)',
    detected_diseases: [
      {
        disease: 'Leaf Blight',
        confidence: 0.78,
        severity: 'moderate',
        affected_area_pct: 25,
        treatment: 'Apply Mancozeb 75% WP',
        prevention: 'Use disease-resistant varieties',
      },
    ],
    disease_count: 1,
    recommendations: [
      'Isolate affected plants',
      'Apply foliar nitrogen spray',
    ],
    image_analysis: {
      brightness: 120.5,
      greenness_index: 0.38,
      redness_index: 0.40,
      texture_variance: 48.3,
      saturation: 0.32,
    },
  };

  const createMockAssessment = (
    overrides: Partial<VisualAssessment> = {}
  ): VisualAssessment => ({
    id: `va-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId: 'test-session-1',
    createdAt: new Date(),
    soilAnalysis: mockSoilAnalysis,
    soilImageCount: 1,
    cropAnalysis: mockCropAnalysis,
    cropImageCount: 1,
    overallConfidence: 0.75,
    analysisType: 'both',
    processingTime_ms: 1234,
    latitude: 20.9,
    longitude: 77.75,
    ...overrides,
  });

  describe('Storage Operations', () => {
    it('TC4.1: should store assessment and make it retrievable by ID', () => {
      const assessment = createMockAssessment();
      storeAssessment(assessment);

      const retrieved = getAssessment(assessment.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(assessment.id);
      expect(retrieved?.sessionId).toBe(assessment.sessionId);
      expect(retrieved?.soilAnalysis?.soil_type).toBe('Black Cotton Soil (Vertisol)');
    });

    it('TC4.2: should store multiple assessments and retrieve all', () => {
      const assessment1 = createMockAssessment();
      const assessment2 = createMockAssessment();

      storeAssessment(assessment1);
      storeAssessment(assessment2);

      const retrieved1 = getAssessment(assessment1.id);
      const retrieved2 = getAssessment(assessment2.id);

      expect(retrieved1).not.toBeNull();
      expect(retrieved2).not.toBeNull();
      expect(retrieved1?.id).toBe(assessment1.id);
      expect(retrieved2?.id).toBe(assessment2.id);
    });

    it('TC4.3: should update session index when storing with same sessionId', () => {
      const sessionId = `session-${Date.now()}`;
      const assessment1 = createMockAssessment({ sessionId });
      const assessment2 = createMockAssessment({ sessionId });

      storeAssessment(assessment1);
      storeAssessment(assessment2);

      const sessionAssessments = getSessionAssessments(sessionId);
      expect(sessionAssessments.length).toBe(2);
      expect(sessionAssessments.map(a => a.id)).toContain(assessment1.id);
      expect(sessionAssessments.map(a => a.id)).toContain(assessment2.id);
    });
  });

  describe('Retrieval Operations', () => {
    it('TC4.4: should get assessment by ID and return correct data', () => {
      const assessment = createMockAssessment({
        soilAnalysis: mockSoilAnalysis,
        cropAnalysis: null,
        analysisType: 'soil',
      });
      storeAssessment(assessment);

      const retrieved = getAssessment(assessment.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.analysisType).toBe('soil');
      expect(retrieved?.soilAnalysis).not.toBeNull();
      expect(retrieved?.cropAnalysis).toBeNull();
      expect(retrieved?.overallConfidence).toBe(assessment.overallConfidence);
    });

    it('TC4.5: should return null for non-existent ID', () => {
      const retrieved = getAssessment('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('TC4.6: should get all assessments for a session', () => {
      const sessionId = `session-${Date.now()}`;
      const assessment1 = createMockAssessment({ sessionId });
      const assessment2 = createMockAssessment({ sessionId });
      const assessment3 = createMockAssessment({ sessionId: 'other-session' });

      storeAssessment(assessment1);
      storeAssessment(assessment2);
      storeAssessment(assessment3);

      const sessionAssessments = getSessionAssessments(sessionId);
      expect(sessionAssessments.length).toBe(2);
      expect(sessionAssessments.every(a => a.sessionId === sessionId)).toBe(true);
    });

    it('TC4.7: should get latest assessment (most recent)', () => {
      const sessionId = `session-${Date.now()}`;

      // Create assessments with different timestamps
      const assessment1 = createMockAssessment({
        sessionId,
        createdAt: new Date(Date.now() - 3000),
      });
      const assessment2 = createMockAssessment({
        sessionId,
        createdAt: new Date(Date.now() - 2000),
      });
      const assessment3 = createMockAssessment({
        sessionId,
        createdAt: new Date(Date.now() - 1000),
      });

      storeAssessment(assessment1);
      storeAssessment(assessment2);
      storeAssessment(assessment3);

      const latest = getLatestAssessment(sessionId);
      expect(latest).not.toBeNull();
      expect(latest?.id).toBe(assessment3.id);
    });

    it('TC4.7b: should return null when session has no assessments', () => {
      const latest = getLatestAssessment('session-with-no-data');
      expect(latest).toBeNull();
    });
  });

  describe('Cleanup Operations', () => {
    it('TC4.8: should remove assessments older than 1 hour', () => {
      const oldAssessment = createMockAssessment({
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      });
      const recentAssessment = createMockAssessment({
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      });

      storeAssessment(oldAssessment);
      storeAssessment(recentAssessment);

      const cleanedCount = cleanupOldAssessments();
      expect(cleanedCount).toBeGreaterThanOrEqual(1);

      // Old assessment should be gone
      const oldRetrieved = getAssessment(oldAssessment.id);
      expect(oldRetrieved).toBeNull();

      // Recent assessment should still exist
      const recentRetrieved = getAssessment(recentAssessment.id);
      expect(recentRetrieved).not.toBeNull();
    });

    it('TC4.9: should update session index during cleanup', () => {
      const sessionId = `cleanup-session-${Date.now()}`;
      const oldAssessment = createMockAssessment({
        sessionId,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      });

      storeAssessment(oldAssessment);
      cleanupOldAssessments();

      const sessionAssessments = getSessionAssessments(sessionId);
      expect(sessionAssessments.length).toBe(0);
    });
  });

  describe('Type Conversion', () => {
    it('TC4.10: should convert VisualAssessment to VisualIntelligence format', () => {
      const assessment = createMockAssessment();
      const intelligence = toVisualIntelligence(assessment);

      expect(intelligence.hasSoilData).toBe(true);
      expect(intelligence.hasCropData).toBe(true);
      expect(intelligence.overallConfidence).toBe(assessment.overallConfidence);
      expect(intelligence.processingTime_ms).toBe(assessment.processingTime_ms);
    });

    it('TC4.11: should preserve all critical data during conversion', () => {
      const assessment = createMockAssessment();
      const intelligence = toVisualIntelligence(assessment);

      // Check soil data
      expect(intelligence.soil).not.toBeNull();
      expect(intelligence.soil?.type).toBe('Black Cotton Soil (Vertisol)');
      expect(intelligence.soil?.confidence).toBe(0.85);
      expect(intelligence.soil?.ph).toBe(7.8);
      expect(intelligence.soil?.nutrients.nitrogen_kg_ha).toBe(250);
      expect(intelligence.soil?.suitable_crops).toContain('Cotton');
      expect(intelligence.soil?.recommendations.length).toBeGreaterThan(0);

      // Check crop data
      expect(intelligence.crop).not.toBeNull();
      expect(intelligence.crop?.health_score).toBe(0.65);
      expect(intelligence.crop?.growth_stage).toBe('Vegetative (active growth)');
      expect(intelligence.crop?.diseases.length).toBe(1);
      expect(intelligence.crop?.diseases[0].disease).toBe('Leaf Blight');
      expect(intelligence.crop?.diseases[0].treatment).toBe('Apply Mancozeb 75% WP');
    });

    it('TC4.12: should handle null soil/crop data during conversion', () => {
      const soilOnlyAssessment = createMockAssessment({
        cropAnalysis: null,
        analysisType: 'soil',
      });
      const soilIntelligence = toVisualIntelligence(soilOnlyAssessment);

      expect(soilIntelligence.hasSoilData).toBe(true);
      expect(soilIntelligence.hasCropData).toBe(false);
      expect(soilIntelligence.soil).not.toBeNull();
      expect(soilIntelligence.crop).toBeNull();

      const cropOnlyAssessment = createMockAssessment({
        soilAnalysis: null,
        analysisType: 'crop',
      });
      const cropIntelligence = toVisualIntelligence(cropOnlyAssessment);

      expect(cropIntelligence.hasSoilData).toBe(false);
      expect(cropIntelligence.hasCropData).toBe(true);
      expect(cropIntelligence.soil).toBeNull();
      expect(cropIntelligence.crop).not.toBeNull();
    });
  });
});
