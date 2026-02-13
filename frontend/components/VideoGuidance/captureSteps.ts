// components/VideoGuidance/captureSteps.ts - Configuration for image capture steps

export interface CaptureStep {
  id: string;
  title: string;
  instruction: string;
  detailedGuidance: string[];
  icon: string;
  required: boolean;
  type: 'soil' | 'crop' | 'field';
  qualityTips: string[];
}

export const CAPTURE_STEPS: CaptureStep[] = [
  {
    id: 'soil_1',
    title: 'Soil Sample 1',
    instruction: 'Take a close-up photo of your soil',
    detailedGuidance: [
      'Dig a small soil sample (about 6 inches deep)',
      'Hold it 1 foot away from the camera',
      'Ensure good natural lighting',
      'Fill the frame with the soil sample',
    ],
    icon: '🌱',
    required: true,
    type: 'soil',
    qualityTips: [
      'Avoid shadows on the soil',
      'Keep camera steady',
      'Show soil texture clearly',
    ],
  },
  {
    id: 'soil_2',
    title: 'Soil Sample 2',
    instruction: 'Take another soil photo from a different part of your field',
    detailedGuidance: [
      'Move to a different location in your field',
      'Take another soil sample (6 inches deep)',
      'Hold 1 foot from camera',
      'Capture in good lighting',
    ],
    icon: '🌱',
    required: true,
    type: 'soil',
    qualityTips: [
      'Choose a spot 20+ feet from first sample',
      'Avoid waterlogged areas',
      'Clean hands before holding sample',
    ],
  },
  {
    id: 'crop_1',
    title: 'Crop Leaves (Optional)',
    instruction: 'Take a photo of your crop leaves',
    detailedGuidance: [
      'Select healthy and damaged leaves',
      'Hold 6-12 inches from camera',
      'Show both top and bottom of leaves if possible',
      'Capture any spots, discoloration, or damage',
    ],
    icon: '🌿',
    required: false,
    type: 'crop',
    qualityTips: [
      'Focus on leaf details',
      'Natural daylight is best',
      'Show both healthy and problem areas',
    ],
  },
  {
    id: 'field',
    title: 'Field Overview (Optional)',
    instruction: 'Take a wide photo showing your entire field',
    detailedGuidance: [
      'Stand at one edge of your field',
      'Capture as much of the field as possible',
      'Include any visible crops, irrigation, or landmarks',
      'Take photo in landscape orientation',
    ],
    icon: '🏞️',
    required: false,
    type: 'field',
    qualityTips: [
      'Stand in stable position',
      'Capture field boundaries',
      'Morning or evening light is best',
    ],
  },
];

/**
 * Get step by ID
 */
export function getStepById(id: string): CaptureStep | undefined {
  return CAPTURE_STEPS.find((step) => step.id === id);
}

/**
 * Get required steps count
 */
export function getRequiredStepsCount(): number {
  return CAPTURE_STEPS.filter((step) => step.required).length;
}

/**
 * Get total steps count
 */
export function getTotalStepsCount(): number {
  return CAPTURE_STEPS.length;
}

/**
 * Check if all required steps are captured
 */
export function areRequiredStepsCaptured(capturedStepIds: string[]): boolean {
  const requiredSteps = CAPTURE_STEPS.filter((step) => step.required);
  return requiredSteps.every((step) => capturedStepIds.includes(step.id));
}

/**
 * Get next uncaptured step
 */
export function getNextUncapturedStep(
  capturedStepIds: string[]
): CaptureStep | null {
  return CAPTURE_STEPS.find((step) => !capturedStepIds.includes(step.id)) || null;
}

/**
 * Usage:
 * import { CAPTURE_STEPS, areRequiredStepsCaptured } from './captureSteps';
 *
 * const allCaptured = areRequiredStepsCaptured(['soil_1', 'soil_2']);
 * const nextStep = getNextUncapturedStep(['soil_1']);
 */
