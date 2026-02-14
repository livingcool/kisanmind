/**
 * AudioGuidedCapture - Main component for audio-guided image capture
 *
 * Integrates the existing camera capture with:
 * - Real-time quality analysis from the video-quality-service
 * - Multi-language TTS audio instructions from the tts-service
 * - 7-step guided capture flow managed by the video-guidance-orchestrator
 * - Visual quality feedback overlay
 * - Audio playback controls
 *
 * This is the enhanced replacement for the CameraCapture component
 * when audio guidance is enabled.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, RefreshCw, X, Check, SkipForward, Loader2, Volume2 } from 'lucide-react';
import { useVideoStream } from './hooks/useVideoStream';
import { useAudioPlayback, type TTSInstruction } from './hooks/useAudioPlayback';
import { useVideoGuidanceWebSocket } from './hooks/useVideoGuidanceWebSocket';
import GuidanceQualityOverlay from './GuidanceQualityOverlay';
import AudioPlayer from './AudioPlayer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te';

interface AudioGuidedCaptureProps {
  /** Farmer session ID */
  sessionId: string;
  /** Farmer ID */
  farmerId: string;
  /** Preferred language for audio instructions */
  language: SupportedLanguage;
  /** Called when all captures are complete */
  onComplete: (capturedSteps: string[]) => void;
  /** Called when user cancels the guided session */
  onCancel: () => void;
  /** Called when a single image is captured */
  onImageCaptured?: (stepId: string, imageData: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AudioGuidedCapture({
  sessionId,
  farmerId,
  language,
  onComplete,
  onCancel,
  onImageCaptured,
}: AudioGuidedCaptureProps) {
  // Camera stream
  const {
    stream,
    isLoading: cameraLoading,
    error: cameraError,
    videoRef,
    startStream,
    stopStream,
    captureFrame,
  } = useVideoStream({ preferredCamera: 'environment' });

  // Audio playback
  const audio = useAudioPlayback();

  // Guidance WebSocket/REST
  const guidance = useVideoGuidanceWebSocket();

  // Local state
  const [isMuted, setIsMuted] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [overlayColor, setOverlayColor] = useState<'green' | 'yellow' | 'red' | null>(null);
  const [statusText, setStatusText] = useState<string>('Initializing...');
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Register audio instruction handler
  useEffect(() => {
    guidance.onInstruction((tts: TTSInstruction) => {
      if (!isMutedRef.current) {
        audio.play(tts);
      }
    });
  }, []);

  // Register quality feedback handler
  useEffect(() => {
    guidance.onFeedback((feedback) => {
      setQualityScore(feedback.analysis.score);
      setOverlayColor(feedback.feedback.overlayColor);
      setStatusText(feedback.feedback.statusText);
      setCaptureEnabled(feedback.feedback.captureEnabled);
    });
  }, []);

  // Initialize: start camera and guidance session
  useEffect(() => {
    const init = async () => {
      await startStream();
      const guidanceSessionId = await guidance.startSession(farmerId, language);
      if (guidanceSessionId) {
        setIsInitialized(true);
      }
    };
    init();

    return () => {
      stopStream();
      guidance.endSession();
      audio.stopAll();
    };
  }, []);

  // Start frame analysis when camera is ready and session is initialized
  useEffect(() => {
    if (stream && isInitialized && !capturedImage) {
      guidance.startFrameAnalysis(captureFrame);
    }

    return () => {
      guidance.stopFrameAnalysis();
    };
  }, [stream, isInitialized, capturedImage]);

  // Handle capture
  const handleCapture = useCallback(async () => {
    if (isCapturing) return;

    const imageData = captureFrame();
    if (!imageData) return;

    setIsCapturing(true);
    guidance.stopFrameAnalysis();

    setCapturedImage(imageData);
    stopStream();

    // Notify orchestrator
    await guidance.captureImage(imageData);

    // Notify parent
    if (onImageCaptured && guidance.currentStep) {
      onImageCaptured(guidance.currentStep.id, imageData);
    }

    setIsCapturing(false);
  }, [captureFrame, guidance, onImageCaptured, isCapturing, stopStream]);

  // Handle confirm captured image
  const handleConfirm = useCallback(async () => {
    setCapturedImage(null);
    setQualityScore(null);
    setOverlayColor(null);
    setCaptureEnabled(false);

    // Advance to next step
    const result = await guidance.nextStep();

    if (result?.type === 'session_complete') {
      onComplete(guidance.capturedSteps);
      return;
    }

    // Restart camera for next step
    await startStream();
  }, [guidance, onComplete, startStream]);

  // Handle retake
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setQualityScore(null);
    startStream();
  }, [startStream]);

  // Handle skip
  const handleSkip = useCallback(async () => {
    setCapturedImage(null);
    guidance.stopFrameAnalysis();

    const result = await guidance.skipStep();

    if (result?.type === 'session_complete') {
      onComplete(guidance.capturedSteps);
      return;
    }

    setQualityScore(null);
    setOverlayColor(null);
    setCaptureEnabled(false);

    // Restart camera for next step
    if (!stream) {
      await startStream();
    }
  }, [guidance, onComplete, startStream, stream]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      audio.stopAll();
    }
  }, [isMuted, audio]);

  // ---------- Render: Loading ----------
  if (cameraLoading || !isInitialized) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold">
            {cameraLoading ? 'Starting camera...' : 'Connecting to guidance service...'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Please allow camera and audio access when prompted
          </p>
        </div>
      </div>
    );
  }

  // ---------- Render: Camera Error ----------
  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Camera Access Required</h3>
          <p className="text-gray-600 mb-6">{cameraError}</p>
          <div className="space-y-3">
            <button
              onClick={startStream}
              className="w-full min-h-touch px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="w-full min-h-touch px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Render: Preview Mode (after capture) ----------
  if (capturedImage) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Header */}
        <div className="bg-gradient-to-b from-black/80 to-transparent p-4 absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center justify-between text-white">
            <h2 className="text-lg font-bold">Preview</h2>
            <button
              onClick={onCancel}
              className="min-h-touch min-w-touch p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Captured Image */}
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
        </div>

        {/* Action Buttons */}
        <div className="bg-gradient-to-t from-black/80 to-transparent p-6 absolute bottom-0 left-0 right-0">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleRetake}
              className="min-h-touch px-6 py-4 bg-white/20 backdrop-blur text-white font-bold rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className="min-h-touch px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-600 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Check className="w-5 h-5" />
              Confirm
            </button>
          </div>
        </div>

        {/* Audio Player */}
        <AudioPlayer
          isPlaying={audio.isPlaying}
          currentText={audio.currentInstruction?.text ?? null}
          language={language}
          queueLength={audio.queueLength}
          onMuteToggle={handleMuteToggle}
          isMuted={isMuted}
        />
      </div>
    );
  }

  // ---------- Render: Live Camera View ----------
  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4 absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between text-white">
          <div>
            <h2 className="text-lg font-bold">
              {guidance.currentStep?.title ?? 'Capture'}
            </h2>
            <p className="text-sm text-gray-300">
              Step {guidance.currentStep?.stepNumber ?? 0} of {guidance.steps.length}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="min-h-touch min-w-touch p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Camera View with Quality Overlay */}
      <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-40">
        <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Quality Overlay */}
          <GuidanceQualityOverlay
            score={qualityScore}
            isAcceptable={captureEnabled}
            primaryIssue={guidance.lastFeedback?.analysis?.primaryIssue ?? 'good'}
            statusText={statusText}
            overlayColor={overlayColor}
            captureEnabled={captureEnabled}
            isAnalyzing={guidance.isAnalyzing}
            stepNumber={guidance.currentStep?.stepNumber ?? 1}
            totalSteps={guidance.steps.length}
            capturedCount={guidance.capturedSteps.length}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gradient-to-t from-black/80 to-transparent p-6 absolute bottom-0 left-0 right-0">
        <div className="flex items-center justify-center gap-4">
          {/* Skip Button (if optional step) */}
          {guidance.currentStep && !guidance.currentStep.required && (
            <button
              onClick={handleSkip}
              className="min-h-touch px-5 py-3 bg-white/20 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
          )}

          {/* Capture Button */}
          <button
            onClick={handleCapture}
            disabled={!captureEnabled && qualityScore !== null}
            className={`min-h-touch min-w-touch w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${
              captureEnabled
                ? 'bg-gradient-to-br from-green-500 to-green-600 scale-110 animate-pulse'
                : qualityScore !== null
                ? 'bg-white/50 opacity-50 cursor-not-allowed'
                : 'bg-white/90'
            } hover:scale-105`}
          >
            <div
              className={`w-16 h-16 rounded-full border-4 ${
                captureEnabled ? 'border-white' : 'border-gray-300'
              } flex items-center justify-center`}
            >
              {isCapturing ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Camera
                  className={`w-8 h-8 ${captureEnabled ? 'text-white' : 'text-gray-700'}`}
                />
              )}
            </div>
          </button>

          {/* Audio indicator */}
          <button
            onClick={handleMuteToggle}
            className={`min-h-touch w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500/80 text-white'
                : 'bg-white/20 backdrop-blur text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <Volume2 className={`w-5 h-5 ${isMuted ? 'line-through' : ''}`} />
          </button>
        </div>

        {/* Status Text */}
        <div className="mt-3 text-center">
          <p
            className={`text-sm font-semibold ${
              captureEnabled ? 'text-green-400' : 'text-yellow-400'
            }`}
          >
            {captureEnabled
              ? 'Ready to capture!'
              : qualityScore !== null
              ? statusText
              : 'Analyzing frame...'}
          </p>
        </div>
      </div>

      {/* Audio Player (floating) */}
      <AudioPlayer
        isPlaying={audio.isPlaying}
        currentText={audio.currentInstruction?.text ?? null}
        language={language}
        queueLength={audio.queueLength}
        onMuteToggle={handleMuteToggle}
        isMuted={isMuted}
      />
    </div>
  );
}
