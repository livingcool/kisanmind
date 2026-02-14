/**
 * Video Guidance API Routes
 *
 * REST endpoints for the audio-guided image capture flow.
 * These routes proxy requests to the video-guidance-orchestrator,
 * which in turn calls the TTS and quality services.
 *
 * Routes:
 *   POST /api/guidance/session/start              - Start a new guidance session
 *   POST /api/guidance/session/:id/analyze-frame   - Analyze a video frame
 *   POST /api/guidance/session/:id/capture          - Capture an image
 *   POST /api/guidance/session/:id/skip             - Skip current step
 *   POST /api/guidance/session/:id/next             - Advance to next step
 *   POST /api/guidance/session/:id/complete         - Complete the session
 *   GET  /api/guidance/session/:id/status           - Get session status
 *   GET  /api/guidance/health                       - Service health check
 */

import { Router, type Request, type Response } from 'express';

// ---------------------------------------------------------------------------
// Service URLs
// ---------------------------------------------------------------------------

const TTS_SERVICE_URL = process.env.TTS_SERVICE_URL || 'http://localhost:8200';
const QUALITY_SERVICE_URL = process.env.QUALITY_SERVICE_URL || 'http://localhost:8300';

type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te';

// ---------------------------------------------------------------------------
// In-process Session Management
//
// Since the guidance orchestrator runs in the same process as the API server,
// we manage sessions directly here rather than importing from the orchestrator
// (which would add a TypeScript compilation dependency).
// ---------------------------------------------------------------------------

interface GuidanceSession {
  id: string;
  farmerId: string;
  language: SupportedLanguage;
  currentStepIndex: number;
  capturedSteps: string[];
  skippedSteps: string[];
  startedAt: number;
  lastActivityAt: number;
}

interface CaptureStep {
  id: string;
  title: string;
  instructionId: string;
  required: boolean;
  type: 'soil' | 'crop' | 'water' | 'field';
  stepNumber: number;
}

const CAPTURE_STEPS: CaptureStep[] = [
  { id: 'soil_1', title: 'Soil Sample 1', instructionId: 'soil_1', required: true, type: 'soil', stepNumber: 1 },
  { id: 'soil_2', title: 'Soil Sample 2', instructionId: 'soil_2', required: true, type: 'soil', stepNumber: 2 },
  { id: 'crop_healthy', title: 'Crop Leaf (Healthy)', instructionId: 'crop_healthy', required: false, type: 'crop', stepNumber: 3 },
  { id: 'crop_diseased', title: 'Crop Leaf (Diseased)', instructionId: 'crop_diseased', required: false, type: 'crop', stepNumber: 4 },
  { id: 'water_source', title: 'Water Source', instructionId: 'water_source', required: false, type: 'water', stepNumber: 5 },
  { id: 'field_overview', title: 'Field Overview', instructionId: 'field_overview', required: false, type: 'field', stepNumber: 6 },
  { id: 'weeds_issues', title: 'Weeds & Issues', instructionId: 'weeds_issues', required: false, type: 'field', stepNumber: 7 },
];

const sessions = new Map<string, GuidanceSession>();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function getSession(id: string): GuidanceSession | null {
  const session = sessions.get(id);
  if (!session) return null;
  if (Date.now() - session.lastActivityAt > SESSION_TIMEOUT_MS) {
    sessions.delete(id);
    return null;
  }
  session.lastActivityAt = Date.now();
  return session;
}

// ---------------------------------------------------------------------------
// Service Proxy Helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, timeout: number, options?: RequestInit): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

interface TTSResult {
  mode: string;
  instructionId: string;
  language: string;
  text: string;
  audioPath?: string;
  estimatedDuration: number;
  speechApiLang?: string;
}

async function getTTS(instructionId: string, language: SupportedLanguage): Promise<TTSResult | null> {
  try {
    const resp = await fetchWithTimeout(`${TTS_SERVICE_URL}/api/tts/synthesize`, 5000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructionId, language }),
    });
    if (!resp.ok) return null;
    return await resp.json() as TTSResult;
  } catch {
    return null;
  }
}

function buildFallbackTTS(instructionId: string, language: SupportedLanguage, text: string): TTSResult {
  const speechLangMap: Record<SupportedLanguage, string> = {
    en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN',
  };
  return {
    mode: 'client_speech',
    instructionId,
    language,
    text,
    estimatedDuration: Math.max(1000, text.split(/\s+/).length * 400),
    speechApiLang: speechLangMap[language] ?? 'en-IN',
  };
}

interface QualityFeedbackResult {
  analysis: {
    score: number;
    isAcceptable: boolean;
    primaryIssue: string;
    feedbackId: string;
    metrics: { brightness: number; sharpness: number; edgeDensity: number; contrast: number };
    processingTime: number;
  };
  feedback: {
    shouldSpeak: boolean;
    instructionId: string;
    overlayColor: string;
    statusText: string;
    captureEnabled: boolean;
  };
}

async function analyzeFrameViaService(
  imageData: string,
  sessionId: string,
  stepId: string,
): Promise<QualityFeedbackResult | null> {
  try {
    const resp = await fetchWithTimeout(`${QUALITY_SERVICE_URL}/api/quality/analyze-feedback`, 5000, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, sessionId, stepId }),
    });
    if (!resp.ok) return null;
    return await resp.json() as QualityFeedbackResult;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const videoGuidanceRouter = Router();

/**
 * GET /api/guidance/health
 */
videoGuidanceRouter.get('/health', async (_req: Request, res: Response) => {
  const [ttsOk, qualityOk] = await Promise.all([
    fetchWithTimeout(`${TTS_SERVICE_URL}/health`, 3000).then(r => r.ok).catch(() => false),
    fetchWithTimeout(`${QUALITY_SERVICE_URL}/health`, 3000).then(r => r.ok).catch(() => false),
  ]);

  res.json({
    status: 'healthy',
    service: 'video-guidance',
    activeSessions: sessions.size,
    dependencies: {
      tts: ttsOk ? 'connected' : 'disconnected',
      quality: qualityOk ? 'connected' : 'disconnected',
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/guidance/session/start
 *
 * Body: { farmerId: string, language: SupportedLanguage }
 */
videoGuidanceRouter.post('/session/start', async (req: Request, res: Response) => {
  try {
    const { farmerId, language } = req.body;

    if (!farmerId) {
      return res.status(400).json({ error: 'Missing required field: farmerId' });
    }

    const lang: SupportedLanguage = language ?? 'en';
    const sessionId = `guidance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: GuidanceSession = {
      id: sessionId,
      farmerId,
      language: lang,
      currentStepIndex: 0,
      capturedSteps: [],
      skippedSteps: [],
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    sessions.set(sessionId, session);

    const firstStep = CAPTURE_STEPS[0];

    // Get TTS for welcome and first step in parallel
    const [welcomeTTS, stepTTS] = await Promise.all([
      getTTS('session_start', lang),
      getTTS(firstStep.instructionId, lang),
    ]);

    console.log(`[Guidance] Session ${sessionId} started for farmer ${farmerId} (${lang})`);

    res.json({
      session: {
        sessionId,
        steps: CAPTURE_STEPS,
        currentStep: firstStep,
        language: lang,
      },
      welcomeTTS: welcomeTTS ?? buildFallbackTTS(
        'session_start', lang,
        'Welcome to KisanMind visual assessment. Let us begin.',
      ),
      instruction: {
        type: 'instruction',
        tts: stepTTS ?? buildFallbackTTS(
          firstStep.instructionId, lang,
          `Step ${firstStep.stepNumber}. ${firstStep.title}.`,
        ),
        step: firstStep,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Guidance] Session start error:', msg);
    res.status(500).json({ error: 'Failed to start guidance session', message: msg });
  }
});

/**
 * POST /api/guidance/session/:id/analyze-frame
 *
 * Body: { frameData: string (base64), stepId: string }
 */
videoGuidanceRouter.post('/session/:id/analyze-frame', async (req: Request, res: Response) => {
  try {
    const session = getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const { frameData, stepId } = req.body;
    if (!frameData) {
      return res.status(400).json({ error: 'Missing required field: frameData' });
    }

    const currentStep = CAPTURE_STEPS[session.currentStepIndex];
    const effectiveStepId = stepId ?? currentStep?.id;

    // Analyze via quality service
    const result = await analyzeFrameViaService(frameData, session.id, effectiveStepId);

    if (!result) {
      // Quality service unavailable - permissive fallback
      return res.json({
        analysis: {
          score: 70,
          isAcceptable: true,
          primaryIssue: 'good',
          feedbackId: 'quality_acceptable',
          metrics: { brightness: 128, sharpness: 200, edgeDensity: 0.1, contrast: 50 },
          processingTime: 0,
        },
        feedback: {
          shouldSpeak: false,
          instructionId: 'quality_acceptable',
          overlayColor: 'yellow',
          statusText: 'Quality check unavailable',
          captureEnabled: true,
        },
      });
    }

    // If we should speak, get TTS
    let tts: TTSResult | null = null;
    if (result.feedback.shouldSpeak) {
      tts = await getTTS(result.feedback.instructionId, session.language);
    }

    res.json({
      ...result,
      tts: tts ?? undefined,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Guidance] Analyze frame error:', msg);
    res.status(500).json({ error: 'Frame analysis failed', message: msg });
  }
});

/**
 * POST /api/guidance/session/:id/capture
 *
 * Body: { imageData: string, stepId: string }
 */
videoGuidanceRouter.post('/session/:id/capture', async (req: Request, res: Response) => {
  try {
    const session = getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const { stepId } = req.body;
    const currentStep = CAPTURE_STEPS[session.currentStepIndex];
    const effectiveStepId = stepId ?? currentStep?.id;

    // Mark as captured
    if (!session.capturedSteps.includes(effectiveStepId)) {
      session.capturedSteps.push(effectiveStepId);
    }

    console.log(
      `[Guidance] Session ${session.id}: Captured ${effectiveStepId} ` +
      `(${session.capturedSteps.length}/${CAPTURE_STEPS.length})`,
    );

    // Get capture success TTS
    const tts = await getTTS('capture_success', session.language);

    res.json({
      type: 'capture_ack',
      stepId: effectiveStepId,
      success: true,
      tts: tts ?? buildFallbackTTS('capture_success', session.language, 'Image captured!'),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Guidance] Capture error:', msg);
    res.status(500).json({ error: 'Capture failed', message: msg });
  }
});

/**
 * POST /api/guidance/session/:id/skip
 *
 * Body: { stepId: string }
 */
videoGuidanceRouter.post('/session/:id/skip', async (req: Request, res: Response) => {
  try {
    const session = getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const { stepId } = req.body;
    if (stepId && !session.skippedSteps.includes(stepId)) {
      session.skippedSteps.push(stepId);
    }

    // Advance to next step
    return await advanceSession(session, res);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Guidance] Skip error:', msg);
    res.status(500).json({ error: 'Skip failed', message: msg });
  }
});

/**
 * POST /api/guidance/session/:id/next
 *
 * Advance to the next step after a confirmed capture.
 */
videoGuidanceRouter.post('/session/:id/next', async (req: Request, res: Response) => {
  try {
    const session = getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    return await advanceSession(session, res);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Guidance] Next error:', msg);
    res.status(500).json({ error: 'Next step failed', message: msg });
  }
});

/**
 * POST /api/guidance/session/:id/complete
 *
 * Force-complete the session.
 */
videoGuidanceRouter.post('/session/:id/complete', async (req: Request, res: Response) => {
  try {
    const session = getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    const tts = await getTTS('session_complete', session.language);

    console.log(
      `[Guidance] Session ${session.id} completed: ` +
      `${session.capturedSteps.length} captured, ${session.skippedSteps.length} skipped`,
    );

    res.json({
      type: 'session_complete',
      capturedSteps: session.capturedSteps,
      skippedSteps: session.skippedSteps,
      tts: tts ?? buildFallbackTTS('session_complete', session.language, 'Assessment complete!'),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Guidance] Complete error:', msg);
    res.status(500).json({ error: 'Complete failed', message: msg });
  }
});

/**
 * GET /api/guidance/session/:id/status
 */
videoGuidanceRouter.get('/session/:id/status', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }

  const currentStep = CAPTURE_STEPS[session.currentStepIndex];

  res.json({
    sessionId: session.id,
    farmerId: session.farmerId,
    language: session.language,
    currentStep,
    currentStepIndex: session.currentStepIndex,
    totalSteps: CAPTURE_STEPS.length,
    capturedSteps: session.capturedSteps,
    skippedSteps: session.skippedSteps,
    startedAt: new Date(session.startedAt).toISOString(),
    elapsedMs: Date.now() - session.startedAt,
  });
});

// ---------------------------------------------------------------------------
// Helper: Advance Session
// ---------------------------------------------------------------------------

async function advanceSession(session: GuidanceSession, res: Response): Promise<void> {
  const nextIndex = session.currentStepIndex + 1;

  if (nextIndex >= CAPTURE_STEPS.length) {
    // Session complete
    const tts = await getTTS('session_complete', session.language);
    res.json({
      type: 'session_complete',
      capturedSteps: session.capturedSteps,
      skippedSteps: session.skippedSteps,
      tts: tts ?? buildFallbackTTS('session_complete', session.language, 'Assessment complete!'),
    });
    return;
  }

  session.currentStepIndex = nextIndex;
  const nextStep = CAPTURE_STEPS[nextIndex];

  // Reset quality feedback throttle
  try {
    await fetchWithTimeout(
      `${QUALITY_SERVICE_URL}/api/quality/reset/${session.id}`,
      3000,
      { method: 'POST' },
    );
  } catch {
    // Non-critical
  }

  // Get TTS for new step
  const tts = await getTTS(nextStep.instructionId, session.language);

  res.json({
    type: 'step_change',
    step: nextStep,
    tts: tts ?? buildFallbackTTS(
      nextStep.instructionId,
      session.language,
      `Step ${nextStep.stepNumber}. ${nextStep.title}.`,
    ),
    progress: {
      current: nextIndex + 1,
      total: CAPTURE_STEPS.length,
      captured: session.capturedSteps.length,
    },
  });
}

// ---------------------------------------------------------------------------
// Periodic cleanup
// ---------------------------------------------------------------------------

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [id, session] of sessions) {
    if (now - session.lastActivityAt > SESSION_TIMEOUT_MS) {
      sessions.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[Guidance] Cleaned up ${cleaned} expired sessions`);
  }
}, 5 * 60 * 1000);
