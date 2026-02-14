/**
 * Tests for Video Guidance Types
 *
 * Validates type definitions are properly structured and usable.
 * This is primarily a compile-time check wrapped in runtime assertions.
 */

import type {
  SupportedLanguage,
  GuidanceCaptureStep,
  GuidanceSession,
  SessionPhase,
  QualityIssue,
  QualityMetrics,
  QualityResult,
  FeedbackDecision,
  TTSResponse,
  ClientMessage,
  ServerMessage,
} from '../video-guidance-types.js';

describe('Video Guidance Types', () => {
  describe('SupportedLanguage', () => {
    it('should accept valid languages', () => {
      const langs: SupportedLanguage[] = ['en', 'hi', 'mr', 'ta', 'te'];
      expect(langs).toHaveLength(5);
    });
  });

  describe('GuidanceCaptureStep', () => {
    it('should represent a capture step with all required fields', () => {
      const step: GuidanceCaptureStep = {
        id: 'soil_1',
        title: 'Soil Sample 1',
        instructionId: 'soil_1',
        required: true,
        type: 'soil',
        stepNumber: 1,
      };

      expect(step.id).toBe('soil_1');
      expect(step.required).toBe(true);
      expect(step.type).toBe('soil');
    });

    it('should accept quality overrides', () => {
      const step: GuidanceCaptureStep = {
        id: 'soil_1',
        title: 'Soil Sample 1',
        instructionId: 'soil_1',
        required: true,
        type: 'soil',
        stepNumber: 1,
        qualityOverrides: {
          minBrightness: 60,
          maxBrightness: 180,
          minSharpness: 80,
        },
      };

      expect(step.qualityOverrides?.minSharpness).toBe(80);
    });
  });

  describe('GuidanceSession', () => {
    it('should represent a complete session', () => {
      const session: GuidanceSession = {
        id: 'test-session',
        farmerId: 'farmer-1',
        language: 'hi',
        phase: 'capturing',
        currentStepIndex: 2,
        capturedSteps: ['soil_1', 'soil_2'],
        skippedSteps: [],
        startedAt: Date.now(),
        lastActivityAt: Date.now(),
        errors: [],
      };

      expect(session.phase).toBe('capturing');
      expect(session.capturedSteps).toHaveLength(2);
    });
  });

  describe('SessionPhase', () => {
    it('should include all lifecycle phases', () => {
      const phases: SessionPhase[] = [
        'idle',
        'initializing',
        'capturing',
        'reviewing',
        'uploading',
        'completed',
        'error',
      ];
      expect(phases).toHaveLength(7);
    });
  });

  describe('QualityIssue', () => {
    it('should include all quality issue types', () => {
      const issues: QualityIssue[] = ['good', 'blur', 'dark', 'bright', 'far', 'close'];
      expect(issues).toHaveLength(6);
    });
  });

  describe('TTSResponse', () => {
    it('should represent a client_speech response', () => {
      const tts: TTSResponse = {
        mode: 'client_speech',
        instructionId: 'soil_1',
        language: 'hi',
        text: 'Show me your soil',
        estimatedDuration: 2000,
        speechApiLang: 'hi-IN',
      };

      expect(tts.mode).toBe('client_speech');
    });

    it('should represent a file response', () => {
      const tts: TTSResponse = {
        mode: 'file',
        instructionId: 'soil_1',
        language: 'en',
        text: 'Show me your soil',
        audioPath: '/api/tts/audio/en/soil_1.mp3',
        mimeType: 'audio/mpeg',
        estimatedDuration: 3000,
      };

      expect(tts.mode).toBe('file');
      expect(tts.audioPath).toBeDefined();
    });
  });

  describe('ClientMessage', () => {
    it('should support start message', () => {
      const msg: ClientMessage = {
        type: 'start',
        language: 'te',
        farmerId: 'farmer-1',
      };
      expect(msg.type).toBe('start');
    });

    it('should support frame message', () => {
      const msg: ClientMessage = {
        type: 'frame',
        imageData: 'base64...',
        stepId: 'soil_1',
      };
      expect(msg.type).toBe('frame');
    });

    it('should support capture message', () => {
      const msg: ClientMessage = {
        type: 'capture',
        imageData: 'base64...',
        stepId: 'soil_1',
      };
      expect(msg.type).toBe('capture');
    });

    it('should support skip message', () => {
      const msg: ClientMessage = {
        type: 'skip',
        stepId: 'crop_healthy',
      };
      expect(msg.type).toBe('skip');
    });

    it('should support ping message', () => {
      const msg: ClientMessage = { type: 'ping' };
      expect(msg.type).toBe('ping');
    });
  });

  describe('ServerMessage', () => {
    it('should support session message', () => {
      const msg: ServerMessage = {
        type: 'session',
        sessionId: 'sess-1',
        steps: [],
        currentStep: {
          id: 'soil_1',
          title: 'Soil',
          instructionId: 'soil_1',
          required: true,
          type: 'soil',
          stepNumber: 1,
        },
        language: 'en',
      };
      expect(msg.type).toBe('session');
    });

    it('should support feedback message', () => {
      const msg: ServerMessage = {
        type: 'feedback',
        analysis: {
          score: 85,
          isAcceptable: true,
          primaryIssue: 'good',
          feedbackId: 'quality_good',
          metrics: { brightness: 128, sharpness: 200, edgeDensity: 0.1, contrast: 50 },
          processingTime: 12,
        },
        feedback: {
          shouldSpeak: false,
          instructionId: 'quality_good',
          overlayColor: 'green',
          statusText: 'Ready',
          captureEnabled: true,
        },
      };
      expect(msg.type).toBe('feedback');
    });

    it('should support error message', () => {
      const msg: ServerMessage = {
        type: 'error',
        message: 'Session expired',
        code: 'SESSION_EXPIRED',
      };
      expect(msg.type).toBe('error');
    });

    it('should support pong message', () => {
      const msg: ServerMessage = {
        type: 'pong',
        timestamp: Date.now(),
      };
      expect(msg.type).toBe('pong');
    });
  });
});
