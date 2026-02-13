// components/VideoGuidance/CameraCapture.tsx - Main camera capture interface

'use client';

import { useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Loader2 } from 'lucide-react';
import { useVideoStream } from './hooks/useVideoStream';
import { useImageQuality } from './hooks/useImageQuality';
import QualityOverlay from './QualityOverlay';
import { CaptureStep } from './captureSteps';

interface CameraCaptureProps {
  step: CaptureStep;
  onCapture: (imageData: string) => void;
  onSkip?: () => void;
  onCancel: () => void;
}

export default function CameraCapture({
  step,
  onCapture,
  onSkip,
  onCancel,
}: CameraCaptureProps) {
  const {
    stream,
    isLoading,
    error,
    videoRef,
    startStream,
    stopStream,
    captureFrame,
  } = useVideoStream({
    preferredCamera: 'environment',
  });

  const { analyzeQuality, isAnalyzing } = useImageQuality();

  const [quality, setQuality] = useState<any>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);

  // Start camera on mount
  useEffect(() => {
    startStream();

    return () => {
      stopStream();
    };
  }, []);

  // Analyze quality periodically when stream is active
  useEffect(() => {
    if (!stream || capturedImage) return;

    const interval = setInterval(async () => {
      const frame = captureFrame();
      if (frame) {
        const result = await analyzeQuality(frame);
        setQuality(result);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [stream, capturedImage, captureFrame, analyzeQuality]);

  // Handle capture button click
  const handleCapture = async () => {
    const imageData = captureFrame();
    if (!imageData) return;

    setCapturedImage(imageData);
    stopStream();
  };

  // Handle retake
  const handleRetake = () => {
    setCapturedImage(null);
    setQuality(null);
    startStream();
  };

  // Handle confirm
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold">Starting camera...</p>
          <p className="text-sm text-gray-400 mt-2">
            Please allow camera access when prompted
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Camera Access Required
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>

          <div className="space-y-3">
            <button
              onClick={startStream}
              className="w-full min-h-touch px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>

            {onSkip && !step.required && (
              <button
                onClick={onSkip}
                className="w-full min-h-touch px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Skip This Step
              </button>
            )}

            <button
              onClick={onCancel}
              className="w-full min-h-touch px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render preview mode (after capture)
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
      </div>
    );
  }

  // Render live camera view
  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4 absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between text-white">
          <div>
            <h2 className="text-lg font-bold">{step.title}</h2>
            <p className="text-sm text-gray-300">{step.instruction}</p>
          </div>
          <button
            onClick={onCancel}
            className="min-h-touch min-w-touch p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-32">
        <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Quality Overlay */}
          <QualityOverlay quality={quality} isAnalyzing={isAnalyzing} />
        </div>
      </div>

      {/* Guidance Panel (Collapsible) */}
      {showGuidance && (
        <div className="absolute left-4 right-4 top-32 z-20">
          <div className="bg-blue-600/95 backdrop-blur rounded-xl p-4 shadow-lg">
            <div className="flex items-start justify-between mb-2">
              <p className="text-white font-bold text-sm">📸 Tips for Best Results</p>
              <button
                onClick={() => setShowGuidance(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-1">
              {step.qualityTips.map((tip, index) => (
                <li key={index} className="text-white text-xs flex items-start gap-2">
                  <span className="text-blue-300">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="bg-gradient-to-t from-black/80 to-transparent p-6 absolute bottom-0 left-0 right-0">
        <div className="flex items-center justify-center gap-4">
          {/* Skip Button (if optional) */}
          {onSkip && !step.required && (
            <button
              onClick={onSkip}
              className="min-h-touch px-6 py-3 bg-white/20 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/30 transition-all"
            >
              Skip
            </button>
          )}

          {/* Capture Button */}
          <button
            onClick={handleCapture}
            disabled={quality && !quality.isAcceptable}
            className={`min-h-touch min-w-touch w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${
              quality && quality.isAcceptable
                ? 'bg-gradient-to-br from-green-500 to-green-600 scale-110 animate-pulse'
                : 'bg-white/90'
            } ${
              quality && !quality.isAcceptable
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full border-4 ${
                quality && quality.isAcceptable
                  ? 'border-white'
                  : 'border-gray-300'
              } flex items-center justify-center`}
            >
              <Camera
                className={`w-8 h-8 ${
                  quality && quality.isAcceptable ? 'text-white' : 'text-gray-700'
                }`}
              />
            </div>
          </button>

          {/* Show Tips Button */}
          {!showGuidance && (
            <button
              onClick={() => setShowGuidance(true)}
              className="min-h-touch px-6 py-3 bg-white/20 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/30 transition-all"
            >
              Show Tips
            </button>
          )}
        </div>

        {/* Quality Status Text */}
        <div className="mt-4 text-center">
          {quality && (
            <p
              className={`text-sm font-semibold ${
                quality.isAcceptable ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {quality.isAcceptable
                ? '✓ Ready to capture'
                : 'Adjust camera for better quality'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Usage:
 * <CameraCapture
 *   step={CAPTURE_STEPS[0]}
 *   onCapture={(imageData) => console.log('Captured:', imageData)}
 *   onSkip={() => console.log('Skipped')}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */
