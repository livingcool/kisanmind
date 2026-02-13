/**
 * Visual Assessment Database
 *
 * SQLite-based storage for visual assessment results. Stores soil
 * classification and crop disease detection results from the ML
 * inference service, linked to farmer sessions.
 *
 * For the hackathon this uses a simple in-memory store (same pattern
 * as the main session storage). Post-hackathon, this can be migrated
 * to Firestore or a real SQLite database.
 *
 * Schema mirrors what the ML inference service returns, plus metadata
 * for linking assessments to farmer sessions and orchestrator runs.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result from the ML inference soil analysis endpoint. */
export interface SoilAnalysisResult {
  soil_type: string;
  soil_description: string;
  confidence: number;
  texture: string;
  estimated_ph: number;
  organic_carbon_pct: number;
  drainage: string;
  nutrients: {
    nitrogen_kg_ha: number;
    phosphorus_kg_ha: number;
    potassium_kg_ha: number;
  };
  suitable_crops: string[];
  common_regions: string[];
  recommendations: string[];
  image_analysis: {
    brightness: number;
    redness_index: number;
    greenness_index: number;
    texture_variance: number;
    saturation: number;
  };
}

/** Result from the ML inference crop analysis endpoint. */
export interface CropAnalysisResult {
  health_score: number;
  assessment: string;
  growth_stage: string;
  detected_diseases: Array<{
    disease: string;
    confidence: number;
    severity: string;
    affected_area_pct: number;
    treatment: string;
    prevention: string;
  }>;
  disease_count: number;
  recommendations: string[];
  image_analysis: {
    brightness: number;
    greenness_index: number;
    redness_index: number;
    texture_variance: number;
    saturation: number;
  };
}

/** A stored visual assessment record. */
export interface VisualAssessment {
  id: string;
  sessionId: string;
  createdAt: Date;

  // Soil analysis (optional -- farmer may only upload crop images)
  soilAnalysis: SoilAnalysisResult | null;
  soilImageCount: number;

  // Crop analysis (optional -- farmer may only upload soil images)
  cropAnalysis: CropAnalysisResult | null;
  cropImageCount: number;

  // Overall assessment metadata
  overallConfidence: number;
  analysisType: 'soil' | 'crop' | 'both';
  processingTime_ms: number;

  // Location (may differ from farmer profile if images taken elsewhere)
  latitude: number | null;
  longitude: number | null;
}

/**
 * Compact version of visual assessment for the orchestrator.
 * Strips image analysis details and keeps only what the synthesis
 * agent needs for decision-making.
 */
export interface VisualIntelligence {
  hasSoilData: boolean;
  hasCropData: boolean;

  soil: {
    type: string;
    confidence: number;
    texture: string;
    ph: number;
    organic_carbon_pct: number;
    drainage: string;
    nutrients: {
      nitrogen_kg_ha: number;
      phosphorus_kg_ha: number;
      potassium_kg_ha: number;
    };
    suitable_crops: string[];
    recommendations: string[];
  } | null;

  crop: {
    health_score: number;
    assessment: string;
    growth_stage: string;
    diseases: Array<{
      disease: string;
      confidence: number;
      severity: string;
      affected_area_pct: number;
      treatment: string;
    }>;
    recommendations: string[];
  } | null;

  overallConfidence: number;
  processingTime_ms: number;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const assessments = new Map<string, VisualAssessment>();
const sessionAssessments = new Map<string, string[]>(); // sessionId -> assessment IDs

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Store a new visual assessment.
 */
export function storeAssessment(assessment: VisualAssessment): void {
  assessments.set(assessment.id, assessment);

  // Index by session
  const existing = sessionAssessments.get(assessment.sessionId) ?? [];
  existing.push(assessment.id);
  sessionAssessments.set(assessment.sessionId, existing);

  console.log(
    `[VisualAssessmentDB] Stored assessment ${assessment.id} for session ${assessment.sessionId} ` +
    `(type: ${assessment.analysisType}, confidence: ${assessment.overallConfidence})`
  );
}

/**
 * Retrieve an assessment by ID.
 */
export function getAssessment(id: string): VisualAssessment | null {
  return assessments.get(id) ?? null;
}

/**
 * Retrieve all assessments for a session.
 */
export function getSessionAssessments(sessionId: string): VisualAssessment[] {
  const ids = sessionAssessments.get(sessionId) ?? [];
  return ids.map(id => assessments.get(id)).filter(Boolean) as VisualAssessment[];
}

/**
 * Get the latest visual assessment for a session, or null if none exists.
 */
export function getLatestAssessment(sessionId: string): VisualAssessment | null {
  const all = getSessionAssessments(sessionId);
  if (all.length === 0) return null;
  return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

/**
 * Convert a VisualAssessment to the compact VisualIntelligence format
 * used by the orchestrator and synthesis agent.
 */
export function toVisualIntelligence(assessment: VisualAssessment): VisualIntelligence {
  return {
    hasSoilData: assessment.soilAnalysis !== null,
    hasCropData: assessment.cropAnalysis !== null,
    soil: assessment.soilAnalysis
      ? {
          type: assessment.soilAnalysis.soil_type,
          confidence: assessment.soilAnalysis.confidence,
          texture: assessment.soilAnalysis.texture,
          ph: assessment.soilAnalysis.estimated_ph,
          organic_carbon_pct: assessment.soilAnalysis.organic_carbon_pct,
          drainage: assessment.soilAnalysis.drainage,
          nutrients: assessment.soilAnalysis.nutrients,
          suitable_crops: assessment.soilAnalysis.suitable_crops,
          recommendations: assessment.soilAnalysis.recommendations,
        }
      : null,
    crop: assessment.cropAnalysis
      ? {
          health_score: assessment.cropAnalysis.health_score,
          assessment: assessment.cropAnalysis.assessment,
          growth_stage: assessment.cropAnalysis.growth_stage,
          diseases: assessment.cropAnalysis.detected_diseases.map(d => ({
            disease: d.disease,
            confidence: d.confidence,
            severity: d.severity,
            affected_area_pct: d.affected_area_pct,
            treatment: d.treatment,
          })),
          recommendations: assessment.cropAnalysis.recommendations,
        }
      : null,
    overallConfidence: assessment.overallConfidence,
    processingTime_ms: assessment.processingTime_ms,
  };
}

/**
 * Clean up old assessments (older than 1 hour).
 * Called periodically by the session cleanup interval.
 */
export function cleanupOldAssessments(): number {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();
  let cleaned = 0;

  for (const [id, assessment] of assessments.entries()) {
    if (now - assessment.createdAt.getTime() > oneHour) {
      assessments.delete(id);
      cleaned++;

      // Clean up session index
      const sessionIds = sessionAssessments.get(assessment.sessionId);
      if (sessionIds) {
        const filtered = sessionIds.filter(sid => sid !== id);
        if (filtered.length === 0) {
          sessionAssessments.delete(assessment.sessionId);
        } else {
          sessionAssessments.set(assessment.sessionId, filtered);
        }
      }
    }
  }

  if (cleaned > 0) {
    console.log(`[VisualAssessmentDB] Cleaned up ${cleaned} old assessments`);
  }

  return cleaned;
}
