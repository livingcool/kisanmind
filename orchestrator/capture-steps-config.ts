/**
 * Capture Steps Configuration
 *
 * Defines the 7-step capture sequence for the video guidance system.
 * Each step maps to a TTS instruction ID and specifies its requirements.
 */

import { type GuidanceCaptureStep } from './video-guidance-types.js';

export const GUIDANCE_CAPTURE_STEPS: GuidanceCaptureStep[] = [
  {
    id: 'soil_1',
    title: 'Soil Sample 1',
    instructionId: 'soil_1',
    required: true,
    type: 'soil',
    stepNumber: 1,
    qualityOverrides: {
      minSharpness: 80, // Soil needs clear texture
    },
  },
  {
    id: 'soil_2',
    title: 'Soil Sample 2',
    instructionId: 'soil_2',
    required: true,
    type: 'soil',
    stepNumber: 2,
    qualityOverrides: {
      minSharpness: 80,
    },
  },
  {
    id: 'crop_healthy',
    title: 'Crop Leaf (Healthy)',
    instructionId: 'crop_healthy',
    required: false,
    type: 'crop',
    stepNumber: 3,
  },
  {
    id: 'crop_diseased',
    title: 'Crop Leaf (Diseased)',
    instructionId: 'crop_diseased',
    required: false,
    type: 'crop',
    stepNumber: 4,
  },
  {
    id: 'water_source',
    title: 'Water Source',
    instructionId: 'water_source',
    required: false,
    type: 'water',
    stepNumber: 5,
  },
  {
    id: 'field_overview',
    title: 'Field Overview',
    instructionId: 'field_overview',
    required: false,
    type: 'field',
    stepNumber: 6,
    qualityOverrides: {
      minSharpness: 50, // Wide shots can be less sharp
    },
  },
  {
    id: 'weeds_issues',
    title: 'Weeds & Issues',
    instructionId: 'weeds_issues',
    required: false,
    type: 'field',
    stepNumber: 7,
  },
];

/**
 * Get a capture step by ID.
 */
export function getStepById(id: string): GuidanceCaptureStep | undefined {
  return GUIDANCE_CAPTURE_STEPS.find(s => s.id === id);
}

/**
 * Get the number of required steps.
 */
export function getRequiredStepsCount(): number {
  return GUIDANCE_CAPTURE_STEPS.filter(s => s.required).length;
}

/**
 * Check if all required steps are captured.
 */
export function areRequiredStepsCaptured(capturedIds: string[]): boolean {
  return GUIDANCE_CAPTURE_STEPS
    .filter(s => s.required)
    .every(s => capturedIds.includes(s.id));
}

/**
 * Get the next uncaptured step.
 */
export function getNextUncapturedStep(
  capturedIds: string[],
  startFrom: number = 0,
): GuidanceCaptureStep | null {
  for (let i = startFrom; i < GUIDANCE_CAPTURE_STEPS.length; i++) {
    if (!capturedIds.includes(GUIDANCE_CAPTURE_STEPS[i].id)) {
      return GUIDANCE_CAPTURE_STEPS[i];
    }
  }
  return null;
}
