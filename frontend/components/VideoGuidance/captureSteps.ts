/**
 * Capture Steps Configuration
 *
 * Defines the 7-step capture sequence for the video guidance system.
 * This mirrors the orchestrator's capture-steps-config.ts but includes
 * additional UI fields (instruction text, detailed guidance, icons, tips).
 *
 * Steps:
 *   1. Soil Sample 1 (close-up)        [required]
 *   2. Soil Sample 2 (different spot)   [required]
 *   3. Crop Leaf (healthy)              [optional]
 *   4. Crop Leaf (diseased/damaged)     [optional]
 *   5. Water Source                     [optional]
 *   6. Field Overview                   [optional]
 *   7. Weeds & Issues                   [optional]
 */

export interface CaptureStep {
  id: string;
  title: string;
  instruction: string;
  detailedGuidance: string[];
  icon: string;
  required: boolean;
  type: 'soil' | 'crop' | 'water' | 'field';
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
    icon: '\uD83C\uDF31',
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
      'Move to a different location in your field (at least 20 feet away)',
      'Take another soil sample (6 inches deep)',
      'Hold 1 foot from camera',
      'Capture in good lighting',
    ],
    icon: '\uD83C\uDF31',
    required: true,
    type: 'soil',
    qualityTips: [
      'Choose a spot 20+ feet from first sample',
      'Avoid waterlogged areas',
      'Clean hands before holding sample',
    ],
  },
  {
    id: 'crop_healthy',
    title: 'Crop Leaf (Healthy)',
    instruction: 'Show a healthy crop leaf from your field',
    detailedGuidance: [
      'Select a healthy, undamaged leaf',
      'Hold 6-12 inches from the camera',
      'Show the top surface of the leaf',
      'Use natural daylight for best results',
    ],
    icon: '\uD83C\uDF3F',
    required: false,
    type: 'crop',
    qualityTips: [
      'Focus on leaf details',
      'Natural daylight is best',
      'Avoid casting shadows on the leaf',
    ],
  },
  {
    id: 'crop_diseased',
    title: 'Crop Leaf (Diseased)',
    instruction: 'Show any damaged or diseased leaves you can find',
    detailedGuidance: [
      'Find leaves with spots, discoloration, or holes',
      'Hold 6-12 inches from the camera',
      'Focus on the damaged area',
      'Show both top and bottom of the leaf if possible',
    ],
    icon: '\uD83C\uDF42',
    required: false,
    type: 'crop',
    qualityTips: [
      'Capture the problem area clearly',
      'Show the extent of damage',
      'Include leaf edges if holes are present',
    ],
  },
  {
    id: 'water_source',
    title: 'Water Source',
    instruction: 'Show your irrigation water source',
    detailedGuidance: [
      'Point camera at your borewell, well, canal, or pond',
      'Capture the water source area clearly',
      'Include any visible water if possible',
      'Show the surrounding area for context',
    ],
    icon: '\uD83D\uDCA7',
    required: false,
    type: 'water',
    qualityTips: [
      'Show the water source type clearly',
      'Include any infrastructure (pipes, pumps)',
      'Avoid direct sun glare on water surface',
    ],
  },
  {
    id: 'field_overview',
    title: 'Field Overview',
    instruction: 'Take a wide photo showing your entire field',
    detailedGuidance: [
      'Stand at one edge of your field',
      'Capture as much of the field as possible',
      'Include any visible crops, irrigation, or landmarks',
      'Take photo in landscape orientation if possible',
    ],
    icon: '\uD83C\uDFDE\uFE0F',
    required: false,
    type: 'field',
    qualityTips: [
      'Stand in a stable position',
      'Capture field boundaries',
      'Morning or evening light is best',
    ],
  },
  {
    id: 'weeds_issues',
    title: 'Weeds & Issues',
    instruction: 'Show any weeds, pests, or other problems in your field',
    detailedGuidance: [
      'Find any visible weeds growing in your field',
      'Show insect damage or pest presence if visible',
      'Capture any waterlogging or erosion problems',
      'Focus on the most significant issue you see',
    ],
    icon: '\uD83C\uDF3E',
    required: false,
    type: 'field',
    qualityTips: [
      'Get close enough to show detail',
      'Capture the problem in context',
      'Show extent of weed coverage if widespread',
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
