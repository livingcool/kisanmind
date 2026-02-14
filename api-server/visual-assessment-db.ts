/**
 * Visual Assessment Database
 *
 * Persistent storage for visual assessment results using Firebase Firestore.
 * Stores soil classification and crop disease detection results from the ML
 * inference service, linked to farmer sessions.
 *
 * Storage strategy:
 *   - Primary:  Firestore (persistent across restarts)
 *   - Cache:    In-memory Map (fast access for current session)
 *   - Fallback: In-memory only (when Firebase unavailable)
 *
 * Schema mirrors what the ML inference service returns, plus metadata
 * for linking assessments to farmer sessions and orchestrator runs.
 */

import {
  isFirebaseAvailable,
  storeVisualAssessment as fbStoreVisualAssessment,
  getVisualAssessment as fbGetVisualAssessment,
  getSessionVisualAssessments as fbGetSessionVisualAssessments,
  getLatestVisualAssessment as fbGetLatestVisualAssessment,
  cleanupExpiredVisualAssessments as fbCleanupExpiredVisualAssessments,
  toDate,
} from './firebase.js';

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
 * Store a new visual assessment in both Firestore and in-memory cache.
 */
export async function storeAssessment(assessment: VisualAssessment): Promise<void> {
  // Always store in-memory for fast access
  assessments.set(assessment.id, assessment);

  // Index by session
  const existing = sessionAssessments.get(assessment.sessionId) ?? [];
  existing.push(assessment.id);
  sessionAssessments.set(assessment.sessionId, existing);

  console.log(
    `[VisualAssessmentDB] Stored assessment ${assessment.id} for session ${assessment.sessionId} ` +
    `(type: ${assessment.analysisType}, confidence: ${assessment.overallConfidence})`
  );

  // Persist to Firebase (best effort)
  if (isFirebaseAvailable()) {
    await fbStoreVisualAssessment({
      id: assessment.id,
      sessionId: assessment.sessionId,
      soilAnalysis: assessment.soilAnalysis,
      soilImageCount: assessment.soilImageCount,
      cropAnalysis: assessment.cropAnalysis,
      cropImageCount: assessment.cropImageCount,
      overallConfidence: assessment.overallConfidence,
      analysisType: assessment.analysisType,
      processingTime_ms: assessment.processingTime_ms,
      latitude: assessment.latitude,
      longitude: assessment.longitude,
    });
  }
}

/**
 * Retrieve an assessment by ID. Checks in-memory first, then Firestore.
 */
export async function getAssessment(id: string): Promise<VisualAssessment | null> {
  // Check in-memory first
  const cached = assessments.get(id);
  if (cached) return cached;

  // Fall back to Firestore
  if (isFirebaseAvailable()) {
    const fbDoc = await fbGetVisualAssessment(id);
    if (fbDoc) {
      const assessment: VisualAssessment = {
        id: fbDoc.id,
        sessionId: fbDoc.sessionId,
        createdAt: toDate(fbDoc.createdAt),
        soilAnalysis: fbDoc.soilAnalysis,
        soilImageCount: fbDoc.soilImageCount,
        cropAnalysis: fbDoc.cropAnalysis,
        cropImageCount: fbDoc.cropImageCount,
        overallConfidence: fbDoc.overallConfidence,
        analysisType: fbDoc.analysisType,
        processingTime_ms: fbDoc.processingTime_ms,
        latitude: fbDoc.latitude,
        longitude: fbDoc.longitude,
      };
      // Hydrate cache
      assessments.set(id, assessment);
      return assessment;
    }
  }

  return null;
}

/**
 * Retrieve all assessments for a session. Checks in-memory first, then Firestore.
 */
export async function getSessionAssessments(sessionId: string): Promise<VisualAssessment[]> {
  // Check if we have cached assessments
  const ids = sessionAssessments.get(sessionId) ?? [];
  if (ids.length > 0) {
    const cached = ids.map(id => assessments.get(id)).filter(Boolean) as VisualAssessment[];
    if (cached.length > 0) return cached;
  }

  // Fall back to Firestore
  if (isFirebaseAvailable()) {
    const fbDocs = await fbGetSessionVisualAssessments(sessionId);
    const results: VisualAssessment[] = fbDocs.map(fbDoc => ({
      id: fbDoc.id,
      sessionId: fbDoc.sessionId,
      createdAt: toDate(fbDoc.createdAt),
      soilAnalysis: fbDoc.soilAnalysis,
      soilImageCount: fbDoc.soilImageCount,
      cropAnalysis: fbDoc.cropAnalysis,
      cropImageCount: fbDoc.cropImageCount,
      overallConfidence: fbDoc.overallConfidence,
      analysisType: fbDoc.analysisType,
      processingTime_ms: fbDoc.processingTime_ms,
      latitude: fbDoc.latitude,
      longitude: fbDoc.longitude,
    }));

    // Hydrate cache
    results.forEach(assessment => {
      assessments.set(assessment.id, assessment);
      const existing = sessionAssessments.get(sessionId) ?? [];
      if (!existing.includes(assessment.id)) {
        existing.push(assessment.id);
        sessionAssessments.set(sessionId, existing);
      }
    });

    return results;
  }

  return [];
}

/**
 * Get the latest visual assessment for a session, or null if none exists.
 */
export async function getLatestAssessment(sessionId: string): Promise<VisualAssessment | null> {
  // Try in-memory first
  const ids = sessionAssessments.get(sessionId) ?? [];
  if (ids.length > 0) {
    const cached = ids.map(id => assessments.get(id)).filter(Boolean) as VisualAssessment[];
    if (cached.length > 0) {
      return cached.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    }
  }

  // Fall back to Firestore
  if (isFirebaseAvailable()) {
    const fbDoc = await fbGetLatestVisualAssessment(sessionId);
    if (fbDoc) {
      const assessment: VisualAssessment = {
        id: fbDoc.id,
        sessionId: fbDoc.sessionId,
        createdAt: toDate(fbDoc.createdAt),
        soilAnalysis: fbDoc.soilAnalysis,
        soilImageCount: fbDoc.soilImageCount,
        cropAnalysis: fbDoc.cropAnalysis,
        cropImageCount: fbDoc.cropImageCount,
        overallConfidence: fbDoc.overallConfidence,
        analysisType: fbDoc.analysisType,
        processingTime_ms: fbDoc.processingTime_ms,
        latitude: fbDoc.latitude,
        longitude: fbDoc.longitude,
      };
      // Hydrate cache
      assessments.set(assessment.id, assessment);
      return assessment;
    }
  }

  return null;
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
 * Clean up old assessments from in-memory cache (older than 1 hour).
 * Also triggers Firebase cleanup for expired assessments (30 days).
 * Called periodically by the session cleanup interval.
 */
export async function cleanupOldAssessments(): Promise<number> {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();
  let cleaned = 0;

  // Clean in-memory cache (1 hour TTL)
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
    console.log(`[VisualAssessmentDB] Cleaned up ${cleaned} old in-memory assessments`);
  }

  // Clean Firestore (30 day TTL)
  if (isFirebaseAvailable()) {
    const fbCleaned = await fbCleanupExpiredVisualAssessments();
    if (fbCleaned > 0) {
      console.log(`[VisualAssessmentDB] Cleaned up ${fbCleaned} expired assessments from Firebase`);
    }
  }

  return cleaned;
}
