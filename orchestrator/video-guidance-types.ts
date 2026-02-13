/**
 * Video Guidance Orchestrator - Type Definitions
 *
 * Shared types for the video guidance capture flow, covering:
 * - Capture step configuration
 * - Session state management
 * - WebSocket message protocol
 * - Quality and TTS integration types
 */

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te';

// ---------------------------------------------------------------------------
// Capture Steps
// ---------------------------------------------------------------------------

export interface GuidanceCaptureStep {
  id: string;
  title: string;
  /** TTS instruction ID to speak when this step starts */
  instructionId: string;
  /** Whether this step is required for assessment */
  required: boolean;
  /** Image type category */
  type: 'soil' | 'crop' | 'water' | 'field';
  /** Step number (1-7) */
  stepNumber: number;
  /** Step-specific quality thresholds (overrides defaults) */
  qualityOverrides?: {
    minBrightness?: number;
    maxBrightness?: number;
    minSharpness?: number;
  };
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type SessionPhase =
  | 'idle'
  | 'initializing'
  | 'capturing'
  | 'reviewing'
  | 'uploading'
  | 'completed'
  | 'error';

export interface GuidanceSession {
  id: string;
  farmerId: string;
  language: SupportedLanguage;
  phase: SessionPhase;
  currentStepIndex: number;
  capturedSteps: string[];
  skippedSteps: string[];
  startedAt: number;
  lastActivityAt: number;
  /** Errors encountered during session */
  errors: string[];
}

// ---------------------------------------------------------------------------
// Quality Analysis (from video-quality-service)
// ---------------------------------------------------------------------------

export type QualityIssue = 'good' | 'blur' | 'dark' | 'bright' | 'far' | 'close';

export interface QualityMetrics {
  brightness: number;
  sharpness: number;
  edgeDensity: number;
  contrast: number;
}

export interface QualityResult {
  score: number;
  isAcceptable: boolean;
  primaryIssue: QualityIssue;
  feedbackId: string;
  metrics: QualityMetrics;
  processingTime: number;
}

export interface FeedbackDecision {
  shouldSpeak: boolean;
  instructionId: string;
  overlayColor: 'green' | 'yellow' | 'red';
  statusText: string;
  captureEnabled: boolean;
}

// ---------------------------------------------------------------------------
// TTS (from tts-service)
// ---------------------------------------------------------------------------

export interface TTSResponse {
  mode: 'file' | 'client_speech' | 'external_api';
  instructionId: string;
  language: SupportedLanguage;
  text: string;
  audioPath?: string;
  audioData?: string;
  mimeType?: string;
  estimatedDuration: number;
  speechApiLang?: string;
}

// ---------------------------------------------------------------------------
// WebSocket Protocol
// ---------------------------------------------------------------------------

/** Messages from client to server */
export type ClientMessage =
  | ClientStartMessage
  | ClientFrameMessage
  | ClientCaptureMessage
  | ClientSkipMessage
  | ClientNextMessage
  | ClientCompleteMessage
  | ClientPingMessage;

export interface ClientStartMessage {
  type: 'start';
  language: SupportedLanguage;
  farmerId: string;
  sessionId?: string;
}

export interface ClientFrameMessage {
  type: 'frame';
  imageData: string;
  stepId: string;
}

export interface ClientCaptureMessage {
  type: 'capture';
  imageData: string;
  stepId: string;
}

export interface ClientSkipMessage {
  type: 'skip';
  stepId: string;
}

export interface ClientNextMessage {
  type: 'next';
}

export interface ClientCompleteMessage {
  type: 'complete';
}

export interface ClientPingMessage {
  type: 'ping';
}

/** Messages from server to client */
export type ServerMessage =
  | ServerSessionMessage
  | ServerInstructionMessage
  | ServerFeedbackMessage
  | ServerCaptureAckMessage
  | ServerStepMessage
  | ServerCompleteMessage
  | ServerErrorMessage
  | ServerPongMessage;

export interface ServerSessionMessage {
  type: 'session';
  sessionId: string;
  steps: GuidanceCaptureStep[];
  currentStep: GuidanceCaptureStep;
  language: SupportedLanguage;
}

export interface ServerInstructionMessage {
  type: 'instruction';
  tts: TTSResponse;
  step: GuidanceCaptureStep;
}

export interface ServerFeedbackMessage {
  type: 'feedback';
  analysis: QualityResult;
  feedback: FeedbackDecision;
  /** TTS data if shouldSpeak is true */
  tts?: TTSResponse;
}

export interface ServerCaptureAckMessage {
  type: 'capture_ack';
  stepId: string;
  success: boolean;
  /** TTS for capture success/failure */
  tts?: TTSResponse;
}

export interface ServerStepMessage {
  type: 'step_change';
  step: GuidanceCaptureStep;
  /** TTS instruction for the new step */
  tts: TTSResponse;
  progress: {
    current: number;
    total: number;
    captured: number;
  };
}

export interface ServerCompleteMessage {
  type: 'session_complete';
  capturedSteps: string[];
  skippedSteps: string[];
  /** TTS for session completion */
  tts: TTSResponse;
}

export interface ServerErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

export interface ServerPongMessage {
  type: 'pong';
  timestamp: number;
}
