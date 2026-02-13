/**
 * Visual Assessment API Routes
 *
 * Provides REST endpoints for submitting farmer-captured images for
 * ML-based soil classification and crop disease detection.
 *
 * Routes:
 *   POST /api/visual-assessment          - Submit images for analysis
 *   GET  /api/visual-assessment/:id      - Retrieve assessment results
 *   GET  /api/visual-assessment/session/:sessionId - Get all for a session
 *
 * The routes call the Python ML inference service (FastAPI) running on
 * port 8100, store results in the visual assessment database, and return
 * structured results to the frontend.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  storeAssessment,
  getAssessment,
  getSessionAssessments,
  getLatestAssessment,
  toVisualIntelligence,
  type VisualAssessment,
  type SoilAnalysisResult,
  type CropAnalysisResult,
} from './visual-assessment-db.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8100';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ---------------------------------------------------------------------------
// Multer configuration for in-memory file handling
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Max 5 images per request
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Accepted: JPEG, PNG, WebP`));
    }
  },
});

// ---------------------------------------------------------------------------
// ML Service client
// ---------------------------------------------------------------------------

interface MLServiceResponse {
  status: string;
  analysis_type: string;
  processing_time_ms: number;
  image_dimensions: { width: number; height: number };
  result: SoilAnalysisResult | CropAnalysisResult;
}

/**
 * Call the ML inference service to analyze an image.
 *
 * @param endpoint - Either 'analyze-soil' or 'analyze-crop'
 * @param imageBuffer - Raw image bytes
 * @param filename - Original filename
 * @param mimetype - MIME type of the image
 * @param extraFields - Additional form fields (latitude, longitude, crop_name)
 */
async function callMLService(
  endpoint: string,
  imageBuffer: Buffer,
  filename: string,
  mimetype: string,
  extraFields: Record<string, string> = {},
): Promise<MLServiceResponse> {
  const formData = new FormData();

  // Append the image as a Blob
  const blob = new Blob([imageBuffer], { type: mimetype });
  formData.append('image', blob, filename);

  // Append extra fields
  for (const [key, value] of Object.entries(extraFields)) {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  }

  const url = `${ML_SERVICE_URL}/${endpoint}`;
  console.log(`[VisualAssessment] Calling ML service: ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ML service returned ${response.status}: ${errorText}`);
    }

    return await response.json() as MLServiceResponse;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if the ML inference service is reachable.
 */
async function isMLServiceAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${ML_SERVICE_URL}/health`, {
        signal: controller.signal,
      });
      return response.ok;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const visualAssessmentRouter = Router();

/**
 * POST /api/visual-assessment
 *
 * Submit images for soil and/or crop analysis.
 *
 * Form data fields:
 *   - soilImages[]    - One or more soil images (multipart file)
 *   - cropImages[]    - One or more crop images (multipart file)
 *   - sessionId       - The farmer session ID to link this assessment to
 *   - latitude        - Optional GPS latitude
 *   - longitude       - Optional GPS longitude
 *   - cropName        - Optional name of the crop being analyzed
 *   - analysisType    - 'soil' | 'crop' | 'both' (default: auto-detect)
 */
visualAssessmentRouter.post(
  '/',
  upload.fields([
    { name: 'soilImages', maxCount: 3 },
    { name: 'cropImages', maxCount: 3 },
  ]),
  async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      const { sessionId, latitude, longitude, cropName } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          error: 'Missing required field: sessionId',
        });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const soilImages = files?.['soilImages'] ?? [];
      const cropImages = files?.['cropImages'] ?? [];

      if (soilImages.length === 0 && cropImages.length === 0) {
        return res.status(400).json({
          error: 'No images provided. Upload soilImages and/or cropImages.',
        });
      }

      // Check ML service availability
      const mlAvailable = await isMLServiceAvailable();
      if (!mlAvailable) {
        console.warn('[VisualAssessment] ML service unavailable, returning mock fallback');
        // Return a degraded response with a clear indicator
        return res.status(503).json({
          error: 'ML inference service is not running',
          hint: `Start the ML service with: cd services/ml-inference && py -m uvicorn app:app --port 8100`,
          sessionId,
        });
      }

      // Extra fields for ML service calls
      const extraFields: Record<string, string> = {};
      if (latitude) extraFields['latitude'] = String(latitude);
      if (longitude) extraFields['longitude'] = String(longitude);

      // Analyze soil images (use first image; in production, average multiple)
      let soilResult: SoilAnalysisResult | null = null;
      let soilProcessingTime = 0;

      if (soilImages.length > 0) {
        console.log(`[VisualAssessment] Analyzing ${soilImages.length} soil image(s)...`);
        try {
          const mlResponse = await callMLService(
            'analyze-soil',
            soilImages[0].buffer,
            soilImages[0].originalname,
            soilImages[0].mimetype,
            extraFields,
          );
          soilResult = mlResponse.result as SoilAnalysisResult;
          soilProcessingTime = mlResponse.processing_time_ms;
          console.log(
            `[VisualAssessment] Soil analysis: ${soilResult.soil_type} ` +
            `(confidence: ${soilResult.confidence}, ${soilProcessingTime}ms)`
          );
        } catch (err) {
          console.error('[VisualAssessment] Soil analysis failed:', err);
          // Continue -- crop analysis may still work
        }
      }

      // Analyze crop images
      let cropResult: CropAnalysisResult | null = null;
      let cropProcessingTime = 0;

      if (cropImages.length > 0) {
        console.log(`[VisualAssessment] Analyzing ${cropImages.length} crop image(s)...`);
        const cropExtraFields = { ...extraFields };
        if (cropName) cropExtraFields['crop_name'] = cropName;

        try {
          const mlResponse = await callMLService(
            'analyze-crop',
            cropImages[0].buffer,
            cropImages[0].originalname,
            cropImages[0].mimetype,
            cropExtraFields,
          );
          cropResult = mlResponse.result as CropAnalysisResult;
          cropProcessingTime = mlResponse.processing_time_ms;
          console.log(
            `[VisualAssessment] Crop analysis: health=${cropResult.health_score}, ` +
            `diseases=${cropResult.disease_count} (${cropProcessingTime}ms)`
          );
        } catch (err) {
          console.error('[VisualAssessment] Crop analysis failed:', err);
        }
      }

      // Check if we got any results
      if (!soilResult && !cropResult) {
        return res.status(500).json({
          error: 'Both soil and crop analysis failed',
          sessionId,
        });
      }

      // Determine analysis type
      let analysisType: 'soil' | 'crop' | 'both';
      if (soilResult && cropResult) {
        analysisType = 'both';
      } else if (soilResult) {
        analysisType = 'soil';
      } else {
        analysisType = 'crop';
      }

      // Calculate overall confidence
      const confidences: number[] = [];
      if (soilResult) confidences.push(soilResult.confidence);
      if (cropResult) confidences.push(cropResult.health_score);
      const overallConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

      const totalProcessingTime = Date.now() - startTime;

      // Create assessment record
      const assessmentId = `va-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const assessment: VisualAssessment = {
        id: assessmentId,
        sessionId,
        createdAt: new Date(),
        soilAnalysis: soilResult,
        soilImageCount: soilImages.length,
        cropAnalysis: cropResult,
        cropImageCount: cropImages.length,
        overallConfidence: Math.round(overallConfidence * 100) / 100,
        analysisType,
        processingTime_ms: totalProcessingTime,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };

      // Store in database (now async with Firebase)
      await storeAssessment(assessment);

      // Return results
      res.json({
        status: 'success',
        assessmentId,
        sessionId,
        analysisType,
        processingTime_ms: totalProcessingTime,
        overallConfidence: assessment.overallConfidence,
        soil: soilResult
          ? {
              type: soilResult.soil_type,
              confidence: soilResult.confidence,
              texture: soilResult.texture,
              ph: soilResult.estimated_ph,
              drainage: soilResult.drainage,
              suitable_crops: soilResult.suitable_crops,
              recommendations: soilResult.recommendations,
            }
          : null,
        crop: cropResult
          ? {
              health_score: cropResult.health_score,
              assessment: cropResult.assessment,
              growth_stage: cropResult.growth_stage,
              disease_count: cropResult.disease_count,
              diseases: cropResult.detected_diseases,
              recommendations: cropResult.recommendations,
            }
          : null,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[VisualAssessment] Error:', errorMsg);
      res.status(500).json({
        error: 'Visual assessment failed',
        message: errorMsg,
      });
    }
  }
);

/**
 * GET /api/visual-assessment/:id
 *
 * Retrieve a specific visual assessment by ID.
 */
visualAssessmentRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const assessment = await getAssessment(id);

  if (!assessment) {
    return res.status(404).json({
      error: 'Visual assessment not found',
      id,
    });
  }

  res.json({
    status: 'success',
    assessment: {
      id: assessment.id,
      sessionId: assessment.sessionId,
      createdAt: assessment.createdAt.toISOString(),
      analysisType: assessment.analysisType,
      overallConfidence: assessment.overallConfidence,
      processingTime_ms: assessment.processingTime_ms,
      soil: assessment.soilAnalysis,
      crop: assessment.cropAnalysis,
      soilImageCount: assessment.soilImageCount,
      cropImageCount: assessment.cropImageCount,
      location: assessment.latitude
        ? { latitude: assessment.latitude, longitude: assessment.longitude }
        : null,
    },
  });
});

/**
 * GET /api/visual-assessment/session/:sessionId
 *
 * Retrieve all visual assessments for a given farmer session.
 */
visualAssessmentRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const assessments = await getSessionAssessments(sessionId);

  res.json({
    status: 'success',
    sessionId,
    count: assessments.length,
    assessments: assessments.map(a => ({
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      analysisType: a.analysisType,
      overallConfidence: a.overallConfidence,
      processingTime_ms: a.processingTime_ms,
      soil: a.soilAnalysis
        ? { type: a.soilAnalysis.soil_type, confidence: a.soilAnalysis.confidence }
        : null,
      crop: a.cropAnalysis
        ? { health_score: a.cropAnalysis.health_score, disease_count: a.cropAnalysis.disease_count }
        : null,
    })),
  });
});

/**
 * GET /api/visual-assessment/session/:sessionId/latest
 *
 * Retrieve the latest visual assessment for a session, formatted
 * as VisualIntelligence for the orchestrator.
 */
visualAssessmentRouter.get('/session/:sessionId/latest', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const latest = await getLatestAssessment(sessionId);

  if (!latest) {
    return res.json({
      status: 'success',
      sessionId,
      hasVisualData: false,
      intelligence: null,
    });
  }

  res.json({
    status: 'success',
    sessionId,
    hasVisualData: true,
    assessmentId: latest.id,
    intelligence: toVisualIntelligence(latest),
  });
});
