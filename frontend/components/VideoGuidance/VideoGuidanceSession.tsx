// components/VideoGuidance/VideoGuidanceSession.tsx - Main orchestrator for video guidance flow

'use client';

import { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import CameraCapture from './CameraCapture';
import ProgressTracker from './ProgressTracker';
import {
  CAPTURE_STEPS,
  areRequiredStepsCaptured,
  getNextUncapturedStep,
} from './captureSteps';
import { useImageUpload, CapturedImage } from './hooks/useImageUpload';

interface VideoGuidanceSessionProps {
  sessionId: string;
  location: { lat: number; lon: number };
  onComplete: (assessmentId: string) => void;
  onCancel: () => void;
}

export default function VideoGuidanceSession({
  sessionId,
  location,
  onComplete,
  onCancel,
}: VideoGuidanceSessionProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { uploadImages, uploading, progress, error: uploadApiError } = useImageUpload();

  const currentStep = CAPTURE_STEPS[currentStepIndex];
  const capturedStepIds = capturedImages.map((img) => img.id);
  const allRequiredCaptured = areRequiredStepsCaptured(capturedStepIds);
  const allStepsCaptured = capturedImages.length === CAPTURE_STEPS.length;

  // Handle image capture
  const handleCapture = (imageData: string) => {
    const newImage: CapturedImage = {
      id: currentStep.id,
      type: currentStep.type,
      dataUrl: imageData,
      timestamp: Date.now(),
    };

    setCapturedImages((prev) => [...prev, newImage]);
    setShowCamera(false);

    // Move to next step
    if (currentStepIndex < CAPTURE_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // Handle skip step
  const handleSkip = () => {
    setShowCamera(false);

    // Move to next step
    if (currentStepIndex < CAPTURE_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // Handle cancel camera
  const handleCancelCamera = () => {
    setShowCamera(false);
  };

  // Handle retake specific image
  const handleRetake = (stepId: string) => {
    // Remove the image
    setCapturedImages((prev) => prev.filter((img) => img.id !== stepId));

    // Navigate to that step
    const stepIndex = CAPTURE_STEPS.findIndex((step) => step.id === stepId);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
      setShowCamera(true);
    }
  };

  // Handle upload all images
  const handleUploadAll = async () => {
    if (capturedImages.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadImages(capturedImages, sessionId, location);

      if (result.success && result.assessmentId) {
        setUploadSuccess(true);

        // Wait a moment to show success, then complete
        setTimeout(() => {
          onComplete(result.assessmentId!);
        }, 2000);
      } else {
        setUploadError(result.error || 'Upload failed');
        setIsUploading(false);
      }
    } catch (err) {
      setUploadError('Failed to upload images. Please try again.');
      setIsUploading(false);
    }
  };

  // Handle start capturing for current step
  const handleStartCapture = () => {
    setShowCamera(true);
  };

  // Render camera interface
  if (showCamera) {
    return (
      <CameraCapture
        step={currentStep}
        onCapture={handleCapture}
        onSkip={currentStep.required ? undefined : handleSkip}
        onCancel={handleCancelCamera}
      />
    );
  }

  // Render upload success screen
  if (uploadSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-900 to-green-800 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upload Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Your images are being analyzed. This will improve your farming recommendations.
          </p>
          <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing visual data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render uploading screen
  if (isUploading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Uploading Images
          </h2>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">{progress}%</p>
          </div>

          {/* Status Text */}
          <div className="text-center text-gray-700">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">
              {progress < 20
                ? 'Preparing images...'
                : progress < 60
                ? 'Compressing images...'
                : progress < 80
                ? 'Uploading to server...'
                : 'Finalizing upload...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render main review screen
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-green-50 to-emerald-50 flex flex-col z-50 overflow-auto">
      {/* Header */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Visual Assessment</h1>
            <p className="text-sm text-gray-600">
              Capture images for higher accuracy recommendations
            </p>
          </div>
          <button
            onClick={onCancel}
            className="min-h-touch min-w-touch p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Progress Tracker */}
        <div className="mb-6">
          <ProgressTracker
            steps={CAPTURE_STEPS}
            currentStepIndex={currentStepIndex}
            capturedStepIds={capturedStepIds}
          />
        </div>

        {/* Current Step Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
              {currentStep.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentStep.title}
              </h2>
              <p className="text-gray-700 mb-4">{currentStep.instruction}</p>

              {/* Detailed Guidance */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="font-semibold text-blue-900 text-sm mb-2">
                  Step-by-step:
                </p>
                <ol className="space-y-1">
                  {currentStep.detailedGuidance.map((guide, index) => (
                    <li key={index} className="text-sm text-blue-800 flex gap-2">
                      <span className="font-bold">{index + 1}.</span>
                      <span>{guide}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Capture Button */}
              {!capturedStepIds.includes(currentStep.id) ? (
                <button
                  onClick={handleStartCapture}
                  className="w-full min-h-touch px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Start Capture
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-green-100 text-green-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Captured
                  </div>
                  <button
                    onClick={() => handleRetake(currentStep.id)}
                    className="min-h-touch px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Retake
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Captured Images Grid */}
        {capturedImages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Captured Images ({capturedImages.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {capturedImages.map((image) => {
                const step = CAPTURE_STEPS.find((s) => s.id === image.id);
                return (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.dataUrl}
                      alt={step?.title}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-gray-300"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                      <p className="text-white text-xs font-semibold text-center px-2">
                        {step?.title}
                      </p>
                      <button
                        onClick={() => handleRetake(image.id)}
                        className="px-3 py-1.5 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">Upload Failed</p>
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 -mx-4 shadow-lg">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 min-h-touch px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>

            {allRequiredCaptured && (
              <button
                onClick={handleUploadAll}
                disabled={uploading}
                className="flex-1 min-h-touch px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Continue
                    {!allStepsCaptured && ` (${capturedImages.length} images)`}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Info Text */}
          <p className="text-xs text-center text-gray-600 mt-3">
            {allRequiredCaptured
              ? allStepsCaptured
                ? 'All images captured! Upload to continue.'
                : `${capturedImages.length}/${CAPTURE_STEPS.length} images captured. Upload now or capture optional images.`
              : `${CAPTURE_STEPS.filter((s) => s.required).length - capturedStepIds.filter((id) => CAPTURE_STEPS.find((s) => s.id === id)?.required).length} required image(s) remaining`}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Usage:
 * <VideoGuidanceSession
 *   sessionId="session-123"
 *   location={{ lat: 20.5, lon: 77.0 }}
 *   onComplete={(assessmentId) => console.log('Complete:', assessmentId)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */
