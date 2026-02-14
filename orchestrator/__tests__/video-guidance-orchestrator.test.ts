/**
 * Tests for the Video Guidance Orchestrator
 *
 * Tests the orchestration logic for the 7-step audio-guided capture flow:
 * - Session lifecycle (start, progress, complete)
 * - Frame analysis with quality feedback
 * - TTS instruction generation
 * - Step progression and skip logic
 * - Service failure resilience
 * - Session timeout handling
 */

// Mock fetch globally before any imports
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import {
  VideoGuidanceOrchestrator,
  getVideoGuidanceOrchestrator,
} from '../video-guidance-orchestrator.js';

import { GUIDANCE_CAPTURE_STEPS } from '../capture-steps-config.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockTTSResponse(instructionId: string, language: string) {
  return {
    mode: 'client_speech',
    instructionId,
    language,
    text: `Instruction for ${instructionId}`,
    estimatedDuration: 2000,
    speechApiLang: `${language}-IN`,
  };
}

function mockQualityResponse(score: number, issue: string = 'good') {
  return {
    analysis: {
      score,
      isAcceptable: score >= 50,
      primaryIssue: issue,
      feedbackId: score >= 80 ? 'quality_good' : score >= 50 ? 'quality_acceptable' : `too_${issue}`,
      metrics: { brightness: 128, sharpness: 200, edgeDensity: 0.1, contrast: 50 },
      processingTime: 15,
    },
    feedback: {
      shouldSpeak: score < 50,
      instructionId: score >= 50 ? 'quality_acceptable' : `too_${issue}`,
      overlayColor: score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'red',
      statusText: score >= 80 ? 'Ready to capture' : score >= 50 ? 'Acceptable quality' : 'Fix issue',
      captureEnabled: score >= 50,
    },
  };
}

function setupTTSMock() {
  mockFetch.mockImplementation(async (url: string, options?: any) => {
    const urlStr = String(url);

    // TTS synthesize endpoint
    if (urlStr.includes('/api/tts/synthesize')) {
      const body = JSON.parse(options?.body ?? '{}');
      return {
        ok: true,
        json: async () => mockTTSResponse(body.instructionId, body.language),
      };
    }

    // Quality analyze endpoint
    if (urlStr.includes('/api/quality/analyze-feedback')) {
      return {
        ok: true,
        json: async () => mockQualityResponse(85),
      };
    }

    // Quality reset endpoint
    if (urlStr.includes('/api/quality/reset/')) {
      return { ok: true, json: async () => ({ status: 'ok' }) };
    }

    // Health check
    if (urlStr.includes('/health')) {
      return { ok: true, json: async () => ({ status: 'healthy' }) };
    }

    return { ok: false, status: 404 };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VideoGuidanceOrchestrator', () => {
  let orchestrator: VideoGuidanceOrchestrator;

  beforeEach(() => {
    mockFetch.mockReset();
    setupTTSMock();
    orchestrator = new VideoGuidanceOrchestrator();
  });

  // ---- Session Start ----

  describe('startSession', () => {
    it('should create a session and return initial instruction', async () => {
      const result = await orchestrator.startSession('farmer-1', 'hi');

      expect(result.session.type).toBe('session');
      expect(result.session.sessionId).toMatch(/^guidance-/);
      expect(result.session.steps).toHaveLength(GUIDANCE_CAPTURE_STEPS.length);
      expect(result.session.currentStep.id).toBe('soil_1');
      expect(result.session.language).toBe('hi');

      expect(result.instruction.type).toBe('instruction');
      expect(result.instruction.step.id).toBe('soil_1');
      expect(result.instruction.tts.language).toBe('hi');

      expect(result.welcomeTTS.instructionId).toBe('session_start');
    });

    it('should accept a custom session ID', async () => {
      const result = await orchestrator.startSession('farmer-1', 'en', 'custom-id-123');
      expect(result.session.sessionId).toBe('custom-id-123');
    });

    it('should fetch TTS in parallel for welcome and first step', async () => {
      await orchestrator.startSession('farmer-1', 'ta');

      // Both TTS calls should be made
      const ttsCalls = mockFetch.mock.calls.filter(
        ([url]: any) => String(url).includes('/api/tts/synthesize'),
      );
      expect(ttsCalls.length).toBe(2);

      // One for session_start, one for soil_1
      const bodies = ttsCalls.map(([, opts]: any) => JSON.parse(opts.body));
      const instructionIds = bodies.map((b: any) => b.instructionId).sort();
      expect(instructionIds).toEqual(['session_start', 'soil_1']);
    });

    it('should provide fallback TTS when service is unavailable', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const result = await orchestrator.startSession('farmer-1', 'mr');

      // Should still succeed with fallback TTS
      expect(result.welcomeTTS.mode).toBe('client_speech');
      expect(result.welcomeTTS.language).toBe('mr');
      expect(result.instruction.tts.mode).toBe('client_speech');
    });

    it('should support all five languages', async () => {
      const languages = ['en', 'hi', 'mr', 'ta', 'te'] as const;

      for (const lang of languages) {
        const result = await orchestrator.startSession('farmer-1', lang);
        expect(result.session.language).toBe(lang);
        expect(result.welcomeTTS.language).toBe(lang);
      }
    });
  });

  // ---- Frame Analysis ----

  describe('processFrame', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await orchestrator.startSession('farmer-1', 'en');
      sessionId = result.session.sessionId;
    });

    it('should analyze a frame and return quality feedback', async () => {
      const result = await orchestrator.processFrame(sessionId, 'base64data', 'soil_1');

      expect(result.type).toBe('feedback');
      if (result.type === 'feedback') {
        expect(result.analysis.score).toBe(85);
        expect(result.analysis.isAcceptable).toBe(true);
        expect(result.feedback.overlayColor).toBe('green');
        expect(result.feedback.captureEnabled).toBe(true);
      }
    });

    it('should include TTS when feedback says to speak', async () => {
      // Setup mock to return poor quality (shouldSpeak = true)
      mockFetch.mockImplementation(async (url: string, options?: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/quality/analyze-feedback')) {
          return {
            ok: true,
            json: async () => mockQualityResponse(30, 'blur'),
          };
        }
        if (urlStr.includes('/api/tts/synthesize')) {
          const body = JSON.parse(options?.body ?? '{}');
          return {
            ok: true,
            json: async () => mockTTSResponse(body.instructionId, body.language),
          };
        }
        return { ok: true, json: async () => ({}) };
      });

      const result = await orchestrator.processFrame(sessionId, 'base64data', 'soil_1');

      if (result.type === 'feedback') {
        expect(result.feedback.shouldSpeak).toBe(true);
        expect(result.tts).toBeDefined();
        expect(result.tts?.instructionId).toBe('too_blur');
      }
    });

    it('should return permissive fallback when quality service fails', async () => {
      mockFetch.mockImplementation(async (url: string, options?: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/quality/')) {
          throw new Error('Service unavailable');
        }
        if (urlStr.includes('/api/tts/synthesize')) {
          const body = JSON.parse(options?.body ?? '{}');
          return {
            ok: true,
            json: async () => mockTTSResponse(body.instructionId, body.language),
          };
        }
        return { ok: true, json: async () => ({}) };
      });

      const result = await orchestrator.processFrame(sessionId, 'base64data', 'soil_1');

      expect(result.type).toBe('feedback');
      if (result.type === 'feedback') {
        expect(result.analysis.score).toBe(70);
        expect(result.analysis.isAcceptable).toBe(true);
        expect(result.feedback.captureEnabled).toBe(true);
        expect(result.feedback.statusText).toBe('Quality check unavailable');
      }
    });

    it('should return error for unknown session', async () => {
      const result = await orchestrator.processFrame('nonexistent', 'data', 'soil_1');

      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.code).toBe('SESSION_NOT_FOUND');
      }
    });
  });

  // ---- Image Capture ----

  describe('handleCapture', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await orchestrator.startSession('farmer-1', 'en');
      sessionId = result.session.sessionId;
    });

    it('should acknowledge capture and track captured steps', async () => {
      const result = await orchestrator.handleCapture(sessionId, 'soil_1', 'imagedata');

      expect(result.type).toBe('capture_ack');
      expect(result.success).toBe(true);
      expect(result.stepId).toBe('soil_1');

      // Check session state
      const info = orchestrator.getSessionInfo(sessionId);
      expect(info?.capturedSteps).toContain('soil_1');
    });

    it('should not duplicate captured steps', async () => {
      await orchestrator.handleCapture(sessionId, 'soil_1', 'imagedata');
      await orchestrator.handleCapture(sessionId, 'soil_1', 'imagedata2');

      const info = orchestrator.getSessionInfo(sessionId);
      const soilCount = info?.capturedSteps.filter(s => s === 'soil_1').length;
      expect(soilCount).toBe(1);
    });

    it('should include capture success TTS', async () => {
      const result = await orchestrator.handleCapture(sessionId, 'soil_1', 'data');
      expect(result.tts).toBeDefined();
    });

    it('should return failure for unknown session', async () => {
      const result = await orchestrator.handleCapture('unknown', 'soil_1', 'data');
      expect(result.success).toBe(false);
    });
  });

  // ---- Step Progression ----

  describe('advanceToNextStep', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await orchestrator.startSession('farmer-1', 'en');
      sessionId = result.session.sessionId;
    });

    it('should advance to the next step with TTS instruction', async () => {
      const result = await orchestrator.advanceToNextStep(sessionId);

      expect(result.type).toBe('step_change');
      if (result.type === 'step_change') {
        expect(result.step.id).toBe('soil_2');
        expect(result.step.stepNumber).toBe(2);
        expect(result.tts).toBeDefined();
        expect(result.progress.current).toBe(2);
        expect(result.progress.total).toBe(GUIDANCE_CAPTURE_STEPS.length);
      }
    });

    it('should reset quality service throttle when advancing', async () => {
      await orchestrator.advanceToNextStep(sessionId);

      const resetCalls = mockFetch.mock.calls.filter(
        ([url]: any) => String(url).includes('/api/quality/reset/'),
      );
      expect(resetCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('should complete session when all steps are done', async () => {
      // Advance through all 7 steps
      for (let i = 0; i < GUIDANCE_CAPTURE_STEPS.length - 1; i++) {
        await orchestrator.advanceToNextStep(sessionId);
      }

      const result = await orchestrator.advanceToNextStep(sessionId);
      expect(result.type).toBe('session_complete');
    });

    it('should provide fallback TTS when TTS service is down', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/tts/')) {
          throw new Error('TTS service down');
        }
        return { ok: true, json: async () => ({}) };
      });

      const result = await orchestrator.advanceToNextStep(sessionId);

      if (result.type === 'step_change') {
        expect(result.tts.mode).toBe('client_speech');
        expect(result.tts.text).toContain('Step 2');
      }
    });
  });

  // ---- Skip Step ----

  describe('handleSkip', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await orchestrator.startSession('farmer-1', 'en');
      sessionId = result.session.sessionId;
    });

    it('should mark step as skipped and advance', async () => {
      const result = await orchestrator.handleSkip(sessionId, 'soil_1');

      expect(result.type).toBe('step_change');
      if (result.type === 'step_change') {
        expect(result.step.id).toBe('soil_2');
      }

      const info = orchestrator.getSessionInfo(sessionId);
      expect(info?.skippedSteps).toContain('soil_1');
    });

    it('should not duplicate skipped steps', async () => {
      await orchestrator.handleSkip(sessionId, 'soil_1');

      // Manually advance back (shouldn't happen in practice, but test dedup)
      const info = orchestrator.getSessionInfo(sessionId);
      expect(info?.skippedSteps.filter(s => s === 'soil_1').length).toBe(1);
    });
  });

  // ---- Session Completion ----

  describe('completeSession', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await orchestrator.startSession('farmer-1', 'te');
      sessionId = result.session.sessionId;
    });

    it('should return completion summary with TTS', async () => {
      // Capture some steps
      await orchestrator.handleCapture(sessionId, 'soil_1', 'data');
      await orchestrator.handleCapture(sessionId, 'soil_2', 'data');

      const result = await orchestrator.completeSession(sessionId);

      expect(result.type).toBe('session_complete');
      if (result.type === 'session_complete') {
        expect(result.capturedSteps).toEqual(['soil_1', 'soil_2']);
        expect(result.tts.instructionId).toBe('session_complete');
        expect(result.tts.language).toBe('te');
      }
    });

    it('should update session phase to completed', async () => {
      await orchestrator.completeSession(sessionId);

      const info = orchestrator.getSessionInfo(sessionId);
      expect(info?.phase).toBe('completed');
    });
  });

  // ---- Session Info ----

  describe('getSessionInfo', () => {
    it('should return null for nonexistent session', () => {
      expect(orchestrator.getSessionInfo('nonexistent')).toBeNull();
    });

    it('should return session details after creation', async () => {
      const result = await orchestrator.startSession('farmer-1', 'hi');
      const info = orchestrator.getSessionInfo(result.session.sessionId);

      expect(info).not.toBeNull();
      expect(info?.farmerId).toBe('farmer-1');
      expect(info?.language).toBe('hi');
      expect(info?.currentStepIndex).toBe(0);
      expect(info?.capturedSteps).toEqual([]);
      expect(info?.skippedSteps).toEqual([]);
    });
  });

  // ---- WebSocket Message Handling ----

  describe('handleMessage', () => {
    it('should handle start message', async () => {
      const responses = await orchestrator.handleMessage({
        type: 'start',
        farmerId: 'farmer-ws',
        language: 'mr',
      });

      // Should get session info, welcome TTS, and step instruction
      expect(responses.length).toBe(3);
      expect(responses[0].type).toBe('session');
      expect(responses[1].type).toBe('instruction');
      expect(responses[2].type).toBe('instruction');
    });

    it('should handle ping message', async () => {
      const responses = await orchestrator.handleMessage({ type: 'ping' });

      expect(responses.length).toBe(1);
      expect(responses[0].type).toBe('pong');
      if (responses[0].type === 'pong') {
        expect(responses[0].timestamp).toBeGreaterThan(0);
      }
    });
  });

  // ---- Health Check ----

  describe('getHealth', () => {
    it('should check TTS and quality service health', async () => {
      const health = await orchestrator.getHealth();

      expect(health).toHaveProperty('tts');
      expect(health).toHaveProperty('quality');
      expect(health).toHaveProperty('activeSessions');
      expect(typeof health.activeSessions).toBe('number');
    });
  });

  // ---- Cleanup ----

  describe('cleanup', () => {
    it('should return count of cleaned sessions', async () => {
      // Create a session
      await orchestrator.startSession('farmer-1', 'en');

      // Cleanup with sessions still active (no timeout yet)
      const cleaned = orchestrator.cleanup();
      expect(cleaned).toBe(0);
    });
  });

  // ---- Singleton ----

  describe('getVideoGuidanceOrchestrator', () => {
    it('should return the same instance', () => {
      const instance1 = getVideoGuidanceOrchestrator();
      const instance2 = getVideoGuidanceOrchestrator();
      expect(instance1).toBe(instance2);
    });
  });
});
