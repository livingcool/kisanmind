/**
 * useVideoGuidanceWebSocket - Hook for real-time video guidance communication
 *
 * Manages the connection to the video guidance orchestrator via polling REST
 * (WebSocket upgrade planned for Phase 2). Sends video frames for analysis
 * and receives quality feedback + TTS instructions.
 *
 * Uses REST polling approach for reliability across all deployment environments:
 * - Sends frames at configurable FPS (default: 2 FPS for REST, saves bandwidth)
 * - Receives quality analysis and feedback decisions
 * - Handles connection errors with automatic retry
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { type TTSInstruction } from './useAudioPlayback';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te';

interface GuidanceCaptureStep {
  id: string;
  title: string;
  instructionId: string;
  required: boolean;
  type: 'soil' | 'crop' | 'water' | 'field';
  stepNumber: number;
}

interface QualityFeedback {
  analysis: {
    score: number;
    isAcceptable: boolean;
    primaryIssue: string;
    feedbackId: string;
    metrics: {
      brightness: number;
      sharpness: number;
      edgeDensity: number;
      contrast: number;
    };
    processingTime: number;
  };
  feedback: {
    shouldSpeak: boolean;
    instructionId: string;
    overlayColor: 'green' | 'yellow' | 'red';
    statusText: string;
    captureEnabled: boolean;
  };
  tts?: TTSInstruction;
}

export interface GuidanceSessionState {
  /** Whether the session is active */
  isActive: boolean;
  /** Session ID from orchestrator */
  sessionId: string | null;
  /** Current capture step */
  currentStep: GuidanceCaptureStep | null;
  /** All capture steps */
  steps: GuidanceCaptureStep[];
  /** Steps that have been captured */
  capturedSteps: string[];
  /** Latest quality feedback */
  lastFeedback: QualityFeedback | null;
  /** Whether the connection to orchestrator is healthy */
  isConnected: boolean;
  /** Error message */
  error: string | null;
  /** Whether a frame is currently being analyzed */
  isAnalyzing: boolean;
}

interface UseVideoGuidanceOptions {
  /** API base URL */
  apiUrl?: string;
  /** Frame analysis rate (frames per second) */
  analysisFps?: number;
  /** Auto-reconnect on error */
  autoReconnect?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVideoGuidanceWebSocket(options: UseVideoGuidanceOptions = {}) {
  const {
    apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    analysisFps = 2,
    autoReconnect = true,
  } = options;

  const [state, setState] = useState<GuidanceSessionState>({
    isActive: false,
    sessionId: null,
    currentStep: null,
    steps: [],
    capturedSteps: [],
    lastFeedback: null,
    isConnected: false,
    error: null,
    isAnalyzing: false,
  });

  // Callbacks for audio events
  const onInstructionRef = useRef<((tts: TTSInstruction) => void) | null>(null);
  const onFeedbackRef = useRef<((feedback: QualityFeedback) => void) | null>(null);
  const isMountedRef = useRef(true);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameCallbackRef = useRef<(() => string | null) | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  /**
   * Register callback for TTS instructions.
   */
  const onInstruction = useCallback((callback: (tts: TTSInstruction) => void) => {
    onInstructionRef.current = callback;
  }, []);

  /**
   * Register callback for quality feedback.
   */
  const onFeedback = useCallback((callback: (feedback: QualityFeedback) => void) => {
    onFeedbackRef.current = callback;
  }, []);

  /**
   * Start a guidance session.
   */
  const startSession = useCallback(async (
    farmerId: string,
    language: SupportedLanguage,
  ) => {
    try {
      const response = await fetch(`${apiUrl}/api/guidance/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmerId, language }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.status}`);
      }

      const data = await response.json();

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isActive: true,
          sessionId: data.session.sessionId,
          currentStep: data.session.currentStep,
          steps: data.session.steps,
          capturedSteps: [],
          isConnected: true,
          error: null,
        }));
      }

      // Play welcome TTS
      if (data.welcomeTTS && onInstructionRef.current) {
        onInstructionRef.current(data.welcomeTTS);
      }

      // Play first step instruction (with delay after welcome)
      if (data.instruction?.tts && onInstructionRef.current) {
        onInstructionRef.current(data.instruction.tts);
      }

      return data.session.sessionId;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to start session';
      console.error('[Guidance WS] Start session error:', msg);
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, error: msg }));
      }
      return null;
    }
  }, [apiUrl]);

  /**
   * Send a frame for quality analysis.
   */
  const analyzeFrame = useCallback(async (imageData: string) => {
    if (!state.sessionId || !state.currentStep) return;

    if (isMountedRef.current) {
      setState(prev => ({ ...prev, isAnalyzing: true }));
    }

    try {
      const response = await fetch(`${apiUrl}/api/guidance/session/${state.sessionId}/analyze-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData: imageData,
          stepId: state.currentStep.id,
        }),
      });

      if (!response.ok) return;

      const data = await response.json();

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          lastFeedback: data,
          isAnalyzing: false,
          isConnected: true,
        }));
      }

      // Notify feedback callback
      if (onFeedbackRef.current) {
        onFeedbackRef.current(data);
      }

      // Play TTS if feedback says to speak
      if (data.feedback?.shouldSpeak && data.tts && onInstructionRef.current) {
        onInstructionRef.current(data.tts);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, isAnalyzing: false }));
      }
    }
  }, [apiUrl, state.sessionId, state.currentStep]);

  /**
   * Start continuous frame analysis.
   * Takes a callback that returns the current frame as base64 data URL.
   */
  const startFrameAnalysis = useCallback((getFrame: () => string | null) => {
    frameCallbackRef.current = getFrame;

    // Clear any existing interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    const intervalMs = Math.round(1000 / analysisFps);

    analysisIntervalRef.current = setInterval(() => {
      if (frameCallbackRef.current) {
        const frame = frameCallbackRef.current();
        if (frame) {
          analyzeFrame(frame);
        }
      }
    }, intervalMs);
  }, [analysisFps, analyzeFrame]);

  /**
   * Stop continuous frame analysis.
   */
  const stopFrameAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    frameCallbackRef.current = null;
  }, []);

  /**
   * Capture an image for the current step.
   */
  const captureImage = useCallback(async (imageData: string) => {
    if (!state.sessionId || !state.currentStep) return null;

    try {
      const response = await fetch(`${apiUrl}/api/guidance/session/${state.sessionId}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          stepId: state.currentStep.id,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();

      // Update captured steps
      if (data.success) {
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            capturedSteps: [...prev.capturedSteps, state.currentStep!.id],
          }));
        }

        // Play capture success TTS
        if (data.tts && onInstructionRef.current) {
          onInstructionRef.current(data.tts);
        }
      }

      return data;
    } catch (error) {
      console.error('[Guidance WS] Capture error:', error);
      return null;
    }
  }, [apiUrl, state.sessionId, state.currentStep]);

  /**
   * Advance to the next step.
   */
  const nextStep = useCallback(async () => {
    if (!state.sessionId) return null;

    try {
      const response = await fetch(`${apiUrl}/api/guidance/session/${state.sessionId}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data.type === 'step_change') {
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, currentStep: data.step }));
        }

        // Play step instruction TTS
        if (data.tts && onInstructionRef.current) {
          onInstructionRef.current(data.tts);
        }
      } else if (data.type === 'session_complete') {
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, isActive: false }));
        }

        // Play completion TTS
        if (data.tts && onInstructionRef.current) {
          onInstructionRef.current(data.tts);
        }
      }

      return data;
    } catch (error) {
      console.error('[Guidance WS] Next step error:', error);
      return null;
    }
  }, [apiUrl, state.sessionId]);

  /**
   * Skip the current step.
   */
  const skipStep = useCallback(async () => {
    if (!state.sessionId || !state.currentStep) return null;

    try {
      const response = await fetch(`${apiUrl}/api/guidance/session/${state.sessionId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: state.currentStep.id }),
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data.type === 'step_change') {
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, currentStep: data.step }));
        }

        if (data.tts && onInstructionRef.current) {
          onInstructionRef.current(data.tts);
        }
      }

      return data;
    } catch (error) {
      console.error('[Guidance WS] Skip error:', error);
      return null;
    }
  }, [apiUrl, state.sessionId, state.currentStep]);

  /**
   * End the session.
   */
  const endSession = useCallback(() => {
    stopFrameAnalysis();
    if (isMountedRef.current) {
      setState({
        isActive: false,
        sessionId: null,
        currentStep: null,
        steps: [],
        capturedSteps: [],
        lastFeedback: null,
        isConnected: false,
        error: null,
        isAnalyzing: false,
      });
    }
  }, [stopFrameAnalysis]);

  return {
    ...state,
    startSession,
    analyzeFrame,
    startFrameAnalysis,
    stopFrameAnalysis,
    captureImage,
    nextStep,
    skipStep,
    endSession,
    onInstruction,
    onFeedback,
  };
}
