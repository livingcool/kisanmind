// components/VideoGuidance/ProgressTracker.tsx - Shows current step progress

'use client';

import { Check } from 'lucide-react';
import { CaptureStep } from './captureSteps';

interface ProgressTrackerProps {
  steps: CaptureStep[];
  currentStepIndex: number;
  capturedStepIds: string[];
}

export default function ProgressTracker({
  steps,
  currentStepIndex,
  capturedStepIds,
}: ProgressTrackerProps) {
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200">
      {/* Overall Progress */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {capturedStepIds.length} captured
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 mx-4 max-w-xs">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-500 ease-out"
              style={{
                width: `${(capturedStepIds.length / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Completion Percentage */}
        <div className="text-sm font-bold text-primary-700">
          {Math.round((capturedStepIds.length / steps.length) * 100)}%
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const isCaptured = capturedStepIds.includes(step.id);
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex-1 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isCaptured
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-105 shadow-md'
                  : isCurrent
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200 border-2 border-primary-500 scale-105'
                  : 'bg-gray-100 border border-gray-300'
              }`}
            >
              {isCaptured ? (
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              ) : (
                <span
                  className={`text-lg ${
                    isCurrent ? 'scale-125' : ''
                  } transition-transform`}
                >
                  {step.icon}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Name */}
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold text-gray-800">
          {steps[currentStepIndex]?.title}
        </p>
        {!steps[currentStepIndex]?.required && (
          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Optional
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Usage:
 * <ProgressTracker
 *   steps={CAPTURE_STEPS}
 *   currentStepIndex={0}
 *   capturedStepIds={['soil_1']}
 * />
 */
