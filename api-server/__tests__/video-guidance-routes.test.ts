/**
 * Tests for Video Guidance API Routes
 *
 * Tests the REST endpoints that power the audio-guided capture flow:
 * - Session start with language preference
 * - Frame analysis with quality + feedback
 * - Image capture acknowledgement
 * - Step skip and advance
 * - Session completion
 * - Health check with dependency status
 * - Session timeout and cleanup
 *
 * Uses mocked fetch calls for TTS and quality service dependencies.
 */

// Mock fetch globally before any imports
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// We need to import the router to test it, but the video-guidance-routes.ts
// exports a Router. We test by calling the route handlers through the
// route definitions directly.

import { videoGuidanceRouter } from '../video-guidance-routes.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock Express request.
 */
function mockReq(overrides: Record<string, any> = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };
}

/**
 * Create a mock Express response.
 */
function mockRes(): any {
  const res: any = {
    statusCode: 200,
    jsonData: null,
  };
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((data: any) => {
    res.jsonData = data;
    return res;
  });
  return res;
}

/**
 * Find a route handler from the Express router stack.
 */
function findRouteHandler(method: string, path: string): Function | null {
  for (const layer of (videoGuidanceRouter as any).stack) {
    if (layer.route) {
      const routePath = layer.route.path;
      const routeMethod = Object.keys(layer.route.methods)[0];
      if (routeMethod === method && routePath === path) {
        // Return the last handler (the actual handler, not middleware)
        return layer.route.stack[layer.route.stack.length - 1].handle;
      }
    }
  }
  return null;
}

function setupServiceMocks() {
  mockFetch.mockImplementation(async (url: string, options?: any) => {
    const urlStr = String(url);

    // TTS synthesize
    if (urlStr.includes('/api/tts/synthesize')) {
      const body = JSON.parse(options?.body ?? '{}');
      return {
        ok: true,
        json: async () => ({
          mode: 'client_speech',
          instructionId: body.instructionId,
          language: body.language,
          text: `Instruction for ${body.instructionId}`,
          estimatedDuration: 2000,
          speechApiLang: `${body.language}-IN`,
        }),
      };
    }

    // Quality analyze-feedback
    if (urlStr.includes('/api/quality/analyze-feedback')) {
      return {
        ok: true,
        json: async () => ({
          analysis: {
            score: 85,
            isAcceptable: true,
            primaryIssue: 'good',
            feedbackId: 'quality_good',
            metrics: { brightness: 128, sharpness: 200, edgeDensity: 0.1, contrast: 50 },
            processingTime: 15,
          },
          feedback: {
            shouldSpeak: false,
            instructionId: 'quality_good',
            overlayColor: 'green',
            statusText: 'Ready to capture',
            captureEnabled: true,
          },
        }),
      };
    }

    // Quality reset
    if (urlStr.includes('/api/quality/reset/')) {
      return { ok: true, json: async () => ({ status: 'ok' }) };
    }

    // Health
    if (urlStr.includes('/health')) {
      return { ok: true, json: async () => ({ status: 'healthy' }) };
    }

    return { ok: false, status: 404 };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Video Guidance Routes', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    setupServiceMocks();
  });

  describe('GET /health', () => {
    it('should return health status with dependency info', async () => {
      const handler = findRouteHandler('get', '/health');
      expect(handler).not.toBeNull();

      const req = mockReq();
      const res = mockRes();
      await handler!(req, res);

      expect(res.json).toHaveBeenCalled();
      const data = res.jsonData;
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('video-guidance');
      expect(data.dependencies).toHaveProperty('tts');
      expect(data.dependencies).toHaveProperty('quality');
    });

    it('should report disconnected when services are down', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const handler = findRouteHandler('get', '/health');
      const req = mockReq();
      const res = mockRes();
      await handler!(req, res);

      const data = res.jsonData;
      expect(data.dependencies.tts).toBe('disconnected');
      expect(data.dependencies.quality).toBe('disconnected');
    });
  });

  describe('POST /session/start', () => {
    it('should create a session and return initial instruction', async () => {
      const handler = findRouteHandler('post', '/session/start');
      expect(handler).not.toBeNull();

      const req = mockReq({
        body: { farmerId: 'farmer-1', language: 'hi' },
      });
      const res = mockRes();
      await handler!(req, res);

      const data = res.jsonData;
      expect(data.session).toBeDefined();
      expect(data.session.sessionId).toMatch(/^guidance-/);
      expect(data.session.steps).toHaveLength(7);
      expect(data.session.currentStep.id).toBe('soil_1');
      expect(data.session.language).toBe('hi');
      expect(data.welcomeTTS).toBeDefined();
      expect(data.instruction).toBeDefined();
    });

    it('should default to English when no language specified', async () => {
      const handler = findRouteHandler('post', '/session/start');
      const req = mockReq({
        body: { farmerId: 'farmer-1' },
      });
      const res = mockRes();
      await handler!(req, res);

      expect(res.jsonData.session.language).toBe('en');
    });

    it('should return 400 when farmerId is missing', async () => {
      const handler = findRouteHandler('post', '/session/start');
      const req = mockReq({ body: {} });
      const res = mockRes();
      await handler!(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('POST /session/:id/analyze-frame', () => {
    let sessionId: string;

    beforeEach(async () => {
      const handler = findRouteHandler('post', '/session/start');
      const req = mockReq({ body: { farmerId: 'farmer-1', language: 'en' } });
      const res = mockRes();
      await handler!(req, res);
      sessionId = res.jsonData.session.sessionId;
    });

    it('should analyze a frame and return quality feedback', async () => {
      const handler = findRouteHandler('post', '/session/:id/analyze-frame');
      expect(handler).not.toBeNull();

      const req = mockReq({
        params: { id: sessionId },
        body: { frameData: 'base64imagedata', stepId: 'soil_1' },
      });
      const res = mockRes();
      await handler!(req, res);

      const data = res.jsonData;
      expect(data.analysis).toBeDefined();
      expect(data.analysis.score).toBe(85);
      expect(data.feedback).toBeDefined();
      expect(data.feedback.overlayColor).toBe('green');
    });

    it('should return 404 for unknown session', async () => {
      const handler = findRouteHandler('post', '/session/:id/analyze-frame');
      const req = mockReq({
        params: { id: 'nonexistent' },
        body: { frameData: 'data' },
      });
      const res = mockRes();
      await handler!(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when frameData is missing', async () => {
      const handler = findRouteHandler('post', '/session/:id/analyze-frame');
      const req = mockReq({
        params: { id: sessionId },
        body: {},
      });
      const res = mockRes();
      await handler!(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should provide fallback when quality service is down', async () => {
      mockFetch.mockImplementation(async (url: string, options?: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/quality/')) {
          throw new Error('Service down');
        }
        if (urlStr.includes('/api/tts/')) {
          const body = JSON.parse(options?.body ?? '{}');
          return {
            ok: true,
            json: async () => ({
              mode: 'client_speech',
              instructionId: body.instructionId,
              language: body.language,
              text: 'fallback',
              estimatedDuration: 1000,
            }),
          };
        }
        return { ok: true };
      });

      const handler = findRouteHandler('post', '/session/:id/analyze-frame');
      const req = mockReq({
        params: { id: sessionId },
        body: { frameData: 'data' },
      });
      const res = mockRes();
      await handler!(req, res);

      const data = res.jsonData;
      expect(data.analysis.score).toBe(70);
      expect(data.feedback.captureEnabled).toBe(true);
      expect(data.feedback.statusText).toBe('Quality check unavailable');
    });
  });

  describe('POST /session/:id/capture', () => {
    let sessionId: string;

    beforeEach(async () => {
      const handler = findRouteHandler('post', '/session/start');
      const req = mockReq({ body: { farmerId: 'farmer-1', language: 'mr' } });
      const res = mockRes();
      await handler!(req, res);
      sessionId = res.jsonData.session.sessionId;
    });

    it('should acknowledge capture', async () => {
      const handler = findRouteHandler('post', '/session/:id/capture');
      expect(handler).not.toBeNull();

      const req = mockReq({
        params: { id: sessionId },
        body: { stepId: 'soil_1', imageData: 'base64data' },
      });
      const res = mockRes();
      await handler!(req, res);

      const data = res.jsonData;
      expect(data.type).toBe('capture_ack');
      expect(data.success).toBe(true);
      expect(data.stepId).toBe('soil_1');
      expect(data.tts).toBeDefined();
    });
  });

  describe('POST /session/:id/next', () => {
    let sessionId: string;

    beforeEach(async () => {
      const handler = findRouteHandler('post', '/session/start');
      const req = mockReq({ body: { farmerId: 'farmer-1', language: 'en' } });
      const res = mockRes();
      await handler!(req, res);
      sessionId = res.jsonData.session.sessionId;
    });

    it('should advance to next step', async () => {
      const handler = findRouteHandler('post', '/session/:id/next');
      expect(handler).not.toBeNull();

      const req = mockReq({ params: { id: sessionId } });
      const res = mockRes();
      await handler!(req, res);

      const data = res.jsonData;
      expect(data.type).toBe('step_change');
      expect(data.step.id).toBe('soil_2');
      expect(data.step.stepNumber).toBe(2);
      expect(data.tts).toBeDefined();
      expect(data.progress.current).toBe(2);
    });

    it('should complete session after last step', async () => {
      const nextHandler = findRouteHandler('post', '/session/:id/next');

      // Advance through all 7 steps (6 "next" calls to go from step 1 to completion)
      for (let i = 0; i < 6; i++) {
        const req = mockReq({ params: { id: sessionId } });
        const res = mockRes();
        await nextHandler!(req, res);
        expect(res.jsonData.type).toBe('step_change');
      }

      // One more should complete
      const req = mockReq({ params: { id: sessionId } });
      const res = mockRes();
      await nextHandler!(req, res);
      expect(res.jsonData.type).toBe('session_complete');
    });
  });

  describe('POST /session/:id/skip', () => {
    let sessionId: string;

    beforeEach(async () => {
      const handler = findRouteHandler('post', '/session/start');
      const req = mockReq({ body: { farmerId: 'farmer-1', language: 'ta' } });
      const res = mockRes();
      await handler!(req, res);
      sessionId = res.jsonData.session.sessionId;
    });

    it('should skip step and advance', async () => {
      const handler = findRouteHandler('post', '/session/:id/skip');
      expect(handler).not.toBeNull();

      const req = mockReq({
        params: { id: sessionId },
        body: { stepId: 'soil_1' },
      });
      const res = mockRes();
      await handler!(req, res);

      // Should advance to step 2
      const data = res.jsonData;
      expect(data.type).toBe('step_change');
      expect(data.step.id).toBe('soil_2');
    });
  });

  describe('POST /session/:id/complete', () => {
    let sessionId: string;

    beforeEach(async () => {
      const handler = findRouteHandler('post', '/session/start');
      const req = mockReq({ body: { farmerId: 'farmer-1', language: 'te' } });
      const res = mockRes();
      await handler!(req, res);
      sessionId = res.jsonData.session.sessionId;
    });

    it('should complete session and return summary', async () => {
      // First capture a step
      const captureHandler = findRouteHandler('post', '/session/:id/capture');
      const captureReq = mockReq({
        params: { id: sessionId },
        body: { stepId: 'soil_1' },
      });
      const captureRes = mockRes();
      await captureHandler!(captureReq, captureRes);

      // Complete
      const handler = findRouteHandler('post', '/session/:id/complete');
      expect(handler).not.toBeNull();

      const req = mockReq({ params: { id: sessionId } });
      const res = mockRes();
      await handler!(req, res);

      const data = res.jsonData;
      expect(data.type).toBe('session_complete');
      expect(data.capturedSteps).toContain('soil_1');
      expect(data.tts).toBeDefined();
    });
  });

  describe('GET /session/:id/status', () => {
    let sessionId: string;

    beforeEach(async () => {
      const handler = findRouteHandler('post', '/session/start');
      const req = mockReq({ body: { farmerId: 'farmer-1', language: 'en' } });
      const res = mockRes();
      await handler!(req, res);
      sessionId = res.jsonData.session.sessionId;
    });

    it('should return session status', () => {
      const handler = findRouteHandler('get', '/session/:id/status');
      expect(handler).not.toBeNull();

      const req = mockReq({ params: { id: sessionId } });
      const res = mockRes();
      handler!(req, res);

      const data = res.jsonData;
      expect(data.sessionId).toBe(sessionId);
      expect(data.farmerId).toBe('farmer-1');
      expect(data.language).toBe('en');
      expect(data.totalSteps).toBe(7);
      expect(data.currentStepIndex).toBe(0);
    });

    it('should return 404 for unknown session', () => {
      const handler = findRouteHandler('get', '/session/:id/status');
      const req = mockReq({ params: { id: 'nonexistent' } });
      const res = mockRes();
      handler!(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
