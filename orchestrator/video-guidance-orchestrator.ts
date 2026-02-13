/**
 * Video Guidance Orchestrator
 *
 * Manages the 7-step capture sequence for farmer image assessment.
 * Coordinates real-time video quality analysis and multi-language
 * TTS audio feedback to guide farmers through the capture process.
 *
 * Architecture:
 * - Exposes both WebSocket and REST interfaces
 * - Calls video-quality-service for frame analysis
 * - Calls tts-service for audio instruction generation
 * - Manages session state and step progression
 * - Handles partial service failures gracefully
 *
 * This orchestrator runs within the api-server process.
 */

import {
  type SupportedLanguage,
  type GuidanceSession,
  type SessionPhase,
  type GuidanceCaptureStep,
  type QualityResult,
  type FeedbackDecision,
  type TTSResponse,
  type ClientMessage,
  type ServerMessage,
  type ServerSessionMessage,
  type ServerInstructionMessage,
  type ServerFeedbackMessage,
  type ServerCaptureAckMessage,
  type ServerStepMessage,
  type ServerCompleteMessage,
  type ServerErrorMessage,
} from './video-guidance-types.js';

import {
  GUIDANCE_CAPTURE_STEPS,
  areRequiredStepsCaptured,
} from './capture-steps-config.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TTS_SERVICE_URL = process.env.TTS_SERVICE_URL || 'http://localhost:8200';
const QUALITY_SERVICE_URL = process.env.QUALITY_SERVICE_URL || 'http://localhost:8300';

/** Session timeout (30 minutes of inactivity) */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** HTTP request timeout for service calls */
const SERVICE_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Service Health
// ---------------------------------------------------------------------------

interface ServiceHealth {
  tts: boolean;
  quality: boolean;
  lastChecked: number;
}

let serviceHealth: ServiceHealth = {
  tts: false,
  quality: false,
  lastChecked: 0,
};

async function checkServiceHealth(): Promise<ServiceHealth> {
  const now = Date.now();
  // Only re-check every 30 seconds
  if (now - serviceHealth.lastChecked < 30000) {
    return serviceHealth;
  }

  const [ttsOk, qualityOk] = await Promise.all([
    fetchWithTimeout(`${TTS_SERVICE_URL}/health`, SERVICE_TIMEOUT_MS)
      .then(r => r.ok)
      .catch(() => false),
    fetchWithTimeout(`${QUALITY_SERVICE_URL}/health`, SERVICE_TIMEOUT_MS)
      .then(r => r.ok)
      .catch(() => false),
  ]);

  serviceHealth = { tts: ttsOk, quality: qualityOk, lastChecked: now };
  return serviceHealth;
}

// ---------------------------------------------------------------------------
// HTTP utility
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  timeout: number,
  options?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// TTS Service Client
// ---------------------------------------------------------------------------

async function getTTSInstruction(
  instructionId: string,
  language: SupportedLanguage,
): Promise<TTSResponse | null> {
  try {
    const response = await fetchWithTimeout(
      `${TTS_SERVICE_URL}/api/tts/synthesize`,
      SERVICE_TIMEOUT_MS,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId, language }),
      },
    );

    if (!response.ok) {
      console.warn(`[Guidance] TTS service returned ${response.status} for ${instructionId}`);
      return null;
    }

    return await response.json() as TTSResponse;
  } catch (error) {
    console.warn(`[Guidance] TTS service unreachable for ${instructionId}:`, error);
    return null;
  }
}

/**
 * Generate a fallback TTS response when the TTS service is unavailable.
 * Returns a client_speech hint so the browser can use Web Speech API.
 */
function buildFallbackTTS(
  instructionId: string,
  language: SupportedLanguage,
  text: string,
): TTSResponse {
  const speechApiLangMap: Record<SupportedLanguage, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    ta: 'ta-IN',
    te: 'te-IN',
  };

  return {
    mode: 'client_speech',
    instructionId,
    language,
    text,
    estimatedDuration: Math.max(1000, text.split(/\s+/).length * 400),
    speechApiLang: speechApiLangMap[language] ?? 'en-IN',
  };
}

// ---------------------------------------------------------------------------
// Quality Service Client
// ---------------------------------------------------------------------------

interface QualityFeedbackResponse {
  analysis: QualityResult;
  feedback: FeedbackDecision;
}

async function analyzeFrame(
  imageData: string,
  sessionId: string,
  stepId: string,
): Promise<QualityFeedbackResponse | null> {
  try {
    const response = await fetchWithTimeout(
      `${QUALITY_SERVICE_URL}/api/quality/analyze-feedback`,
      SERVICE_TIMEOUT_MS,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, sessionId, stepId }),
      },
    );

    if (!response.ok) {
      console.warn(`[Guidance] Quality service returned ${response.status}`);
      return null;
    }

    return await response.json() as QualityFeedbackResponse;
  } catch (error) {
    console.warn(`[Guidance] Quality service unreachable:`, error);
    return null;
  }
}

async function resetQualitySession(sessionId: string): Promise<void> {
  try {
    await fetchWithTimeout(
      `${QUALITY_SERVICE_URL}/api/quality/reset/${sessionId}`,
      SERVICE_TIMEOUT_MS,
      { method: 'POST' },
    );
  } catch {
    // Non-critical, ignore
  }
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

const sessions = new Map<string, GuidanceSession>();

function createSession(
  sessionId: string,
  farmerId: string,
  language: SupportedLanguage,
): GuidanceSession {
  const session: GuidanceSession = {
    id: sessionId,
    farmerId,
    language,
    phase: 'initializing',
    currentStepIndex: 0,
    capturedSteps: [],
    skippedSteps: [],
    startedAt: Date.now(),
    lastActivityAt: Date.now(),
    errors: [],
  };
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId: string): GuidanceSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Check for timeout
  if (Date.now() - session.lastActivityAt > SESSION_TIMEOUT_MS) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

function updateSession(
  sessionId: string,
  updates: Partial<GuidanceSession>,
): GuidanceSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  Object.assign(session, updates, { lastActivityAt: Date.now() });
  return session;
}

// ---------------------------------------------------------------------------
// Video Guidance Orchestrator
// ---------------------------------------------------------------------------

export class VideoGuidanceOrchestrator {
  /**
   * Start a new guidance session.
   *
   * Returns the session info and the initial step instruction.
   */
  async startSession(
    farmerId: string,
    language: SupportedLanguage,
    sessionId?: string,
  ): Promise<{
    session: ServerSessionMessage;
    instruction: ServerInstructionMessage;
    welcomeTTS: TTSResponse;
  }> {
    const id = sessionId ?? `guidance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = createSession(id, farmerId, language);
    const currentStep = GUIDANCE_CAPTURE_STEPS[0];

    console.log(`[Guidance] Session ${id} started for farmer ${farmerId} (${language})`);

    // Get welcome TTS and first step instruction in parallel
    const [welcomeTTS, stepTTS] = await Promise.all([
      getTTSInstruction('session_start', language),
      getTTSInstruction(currentStep.instructionId, language),
    ]);

    // Update session phase
    updateSession(id, { phase: 'capturing' });

    const welcomeResponse = welcomeTTS ?? buildFallbackTTS(
      'session_start',
      language,
      'Welcome to KisanMind visual assessment. Let us begin.',
    );

    const stepResponse = stepTTS ?? buildFallbackTTS(
      currentStep.instructionId,
      language,
      `Step ${currentStep.stepNumber}. ${currentStep.title}.`,
    );

    return {
      session: {
        type: 'session',
        sessionId: id,
        steps: GUIDANCE_CAPTURE_STEPS,
        currentStep,
        language,
      },
      instruction: {
        type: 'instruction',
        tts: stepResponse,
        step: currentStep,
      },
      welcomeTTS: welcomeResponse,
    };
  }

  /**
   * Process a video frame for quality analysis.
   *
   * Returns quality metrics and optional TTS feedback.
   */
  async processFrame(
    sessionId: string,
    imageData: string,
    stepId: string,
  ): Promise<ServerFeedbackMessage | ServerErrorMessage> {
    const session = getSession(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found or expired', code: 'SESSION_NOT_FOUND' };
    }

    // Update activity timestamp
    updateSession(sessionId, {});

    // Analyze frame via quality service
    const result = await analyzeFrame(imageData, sessionId, stepId);

    if (!result) {
      // Quality service unavailable - return permissive result
      return {
        type: 'feedback',
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
      };
    }

    // Get TTS if feedback mapper says we should speak
    let tts: TTSResponse | undefined;
    if (result.feedback.shouldSpeak) {
      const ttsResult = await getTTSInstruction(
        result.feedback.instructionId,
        session.language,
      );
      tts = ttsResult ?? undefined;
    }

    return {
      type: 'feedback',
      analysis: result.analysis,
      feedback: result.feedback,
      tts,
    };
  }

  /**
   * Handle image capture confirmation.
   *
   * Marks the step as captured and returns acknowledgement.
   */
  async handleCapture(
    sessionId: string,
    stepId: string,
    _imageData: string,
  ): Promise<ServerCaptureAckMessage> {
    const session = getSession(sessionId);
    if (!session) {
      return {
        type: 'capture_ack',
        stepId,
        success: false,
      };
    }

    // Add to captured steps
    if (!session.capturedSteps.includes(stepId)) {
      session.capturedSteps.push(stepId);
    }

    updateSession(sessionId, { capturedSteps: session.capturedSteps });

    // Get capture success TTS
    const tts = await getTTSInstruction('capture_success', session.language);

    console.log(
      `[Guidance] Session ${sessionId}: Captured ${stepId} ` +
      `(${session.capturedSteps.length}/${GUIDANCE_CAPTURE_STEPS.length})`,
    );

    return {
      type: 'capture_ack',
      stepId,
      success: true,
      tts: tts ?? undefined,
    };
  }

  /**
   * Skip the current step and move to the next.
   */
  async handleSkip(
    sessionId: string,
    stepId: string,
  ): Promise<ServerStepMessage | ServerCompleteMessage | ServerErrorMessage> {
    const session = getSession(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found', code: 'SESSION_NOT_FOUND' };
    }

    // Mark as skipped
    if (!session.skippedSteps.includes(stepId)) {
      session.skippedSteps.push(stepId);
    }

    console.log(`[Guidance] Session ${sessionId}: Skipped ${stepId}`);

    return this.advanceToNextStep(sessionId);
  }

  /**
   * Advance to the next step in the sequence.
   */
  async advanceToNextStep(
    sessionId: string,
  ): Promise<ServerStepMessage | ServerCompleteMessage | ServerErrorMessage> {
    const session = getSession(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found', code: 'SESSION_NOT_FOUND' };
    }

    const nextIndex = session.currentStepIndex + 1;

    // Check if we have more steps
    if (nextIndex >= GUIDANCE_CAPTURE_STEPS.length) {
      return this.completeSession(sessionId);
    }

    const nextStep = GUIDANCE_CAPTURE_STEPS[nextIndex];

    // Reset quality feedback throttle for the new step
    await resetQualitySession(sessionId);

    // Get TTS for new step
    const tts = await getTTSInstruction(nextStep.instructionId, session.language);

    updateSession(sessionId, {
      currentStepIndex: nextIndex,
      phase: 'capturing',
    });

    return {
      type: 'step_change',
      step: nextStep,
      tts: tts ?? buildFallbackTTS(
        nextStep.instructionId,
        session.language,
        `Step ${nextStep.stepNumber}. ${nextStep.title}.`,
      ),
      progress: {
        current: nextIndex + 1,
        total: GUIDANCE_CAPTURE_STEPS.length,
        captured: session.capturedSteps.length,
      },
    };
  }

  /**
   * Complete the guidance session.
   */
  async completeSession(
    sessionId: string,
  ): Promise<ServerCompleteMessage | ServerErrorMessage> {
    const session = getSession(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found', code: 'SESSION_NOT_FOUND' };
    }

    updateSession(sessionId, { phase: 'completed' });

    const tts = await getTTSInstruction('session_complete', session.language);

    console.log(
      `[Guidance] Session ${sessionId} completed: ` +
      `${session.capturedSteps.length} captured, ${session.skippedSteps.length} skipped`,
    );

    return {
      type: 'session_complete',
      capturedSteps: session.capturedSteps,
      skippedSteps: session.skippedSteps,
      tts: tts ?? buildFallbackTTS(
        'session_complete',
        session.language,
        'All images captured! Your farm data is being analyzed.',
      ),
    };
  }

  /**
   * Handle incoming WebSocket message and return response message(s).
   */
  async handleMessage(message: ClientMessage): Promise<ServerMessage[]> {
    const responses: ServerMessage[] = [];

    switch (message.type) {
      case 'start': {
        const result = await this.startSession(
          message.farmerId,
          message.language,
          message.sessionId,
        );
        responses.push(result.session);
        // Send welcome TTS first, then step instruction
        responses.push({
          type: 'instruction',
          tts: result.welcomeTTS,
          step: result.session.currentStep,
        });
        responses.push(result.instruction);
        break;
      }

      case 'frame': {
        // We need the sessionId from the frame message context
        // In the WebSocket handler, the sessionId is tracked per connection
        // For REST, it comes from the URL
        // This is handled by the route/WebSocket wrapper
        break;
      }

      case 'capture': {
        // Handled by route/WebSocket wrapper with sessionId
        break;
      }

      case 'skip': {
        // Handled by route/WebSocket wrapper with sessionId
        break;
      }

      case 'next': {
        // Handled by route/WebSocket wrapper with sessionId
        break;
      }

      case 'complete': {
        // Handled by route/WebSocket wrapper with sessionId
        break;
      }

      case 'ping': {
        responses.push({ type: 'pong', timestamp: Date.now() });
        break;
      }
    }

    return responses;
  }

  /**
   * Get session info for status checking.
   */
  getSessionInfo(sessionId: string): GuidanceSession | null {
    return getSession(sessionId);
  }

  /**
   * Get service health status.
   */
  async getHealth(): Promise<ServiceHealth & { activeSessions: number }> {
    const health = await checkServiceHealth();
    return {
      ...health,
      activeSessions: sessions.size,
    };
  }

  /**
   * Cleanup expired sessions.
   */
  cleanup(): number {
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
    return cleaned;
  }
}

// Singleton
let orchestratorInstance: VideoGuidanceOrchestrator | null = null;

export function getVideoGuidanceOrchestrator(): VideoGuidanceOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new VideoGuidanceOrchestrator();
  }
  return orchestratorInstance;
}

// Periodic cleanup
setInterval(() => {
  if (orchestratorInstance) {
    orchestratorInstance.cleanup();
  }
}, 5 * 60 * 1000);
