/**
 * Tests for Capture Steps Configuration
 *
 * Validates the 7-step capture sequence configuration and utility functions.
 */

import {
  GUIDANCE_CAPTURE_STEPS,
  getStepById,
  getRequiredStepsCount,
  areRequiredStepsCaptured,
  getNextUncapturedStep,
} from '../capture-steps-config.js';

describe('GUIDANCE_CAPTURE_STEPS', () => {
  it('should define exactly 7 capture steps', () => {
    expect(GUIDANCE_CAPTURE_STEPS).toHaveLength(7);
  });

  it('should have correct step IDs in order', () => {
    const ids = GUIDANCE_CAPTURE_STEPS.map(s => s.id);
    expect(ids).toEqual([
      'soil_1',
      'soil_2',
      'crop_healthy',
      'crop_diseased',
      'water_source',
      'field_overview',
      'weeds_issues',
    ]);
  });

  it('should have sequential step numbers 1-7', () => {
    const numbers = GUIDANCE_CAPTURE_STEPS.map(s => s.stepNumber);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should require only the two soil samples', () => {
    const required = GUIDANCE_CAPTURE_STEPS.filter(s => s.required);
    expect(required).toHaveLength(2);
    expect(required.map(s => s.id)).toEqual(['soil_1', 'soil_2']);
  });

  it('should have matching instructionId and id for all steps', () => {
    for (const step of GUIDANCE_CAPTURE_STEPS) {
      expect(step.instructionId).toBe(step.id);
    }
  });

  it('should categorize steps by type correctly', () => {
    const typeMap = new Map<string, string[]>();
    for (const step of GUIDANCE_CAPTURE_STEPS) {
      const existing = typeMap.get(step.type) ?? [];
      existing.push(step.id);
      typeMap.set(step.type, existing);
    }

    expect(typeMap.get('soil')).toEqual(['soil_1', 'soil_2']);
    expect(typeMap.get('crop')).toEqual(['crop_healthy', 'crop_diseased']);
    expect(typeMap.get('water')).toEqual(['water_source']);
    expect(typeMap.get('field')).toEqual(['field_overview', 'weeds_issues']);
  });

  it('should have quality overrides for soil and field overview steps', () => {
    const soil1 = GUIDANCE_CAPTURE_STEPS.find(s => s.id === 'soil_1');
    expect(soil1?.qualityOverrides?.minSharpness).toBe(80);

    const fieldOverview = GUIDANCE_CAPTURE_STEPS.find(s => s.id === 'field_overview');
    expect(fieldOverview?.qualityOverrides?.minSharpness).toBe(50);
  });
});

describe('getStepById', () => {
  it('should find existing steps', () => {
    const step = getStepById('soil_1');
    expect(step).toBeDefined();
    expect(step?.title).toBe('Soil Sample 1');
  });

  it('should return undefined for nonexistent step', () => {
    expect(getStepById('nonexistent')).toBeUndefined();
  });
});

describe('getRequiredStepsCount', () => {
  it('should return 2 (two soil samples)', () => {
    expect(getRequiredStepsCount()).toBe(2);
  });
});

describe('areRequiredStepsCaptured', () => {
  it('should return true when both soil samples are captured', () => {
    expect(areRequiredStepsCaptured(['soil_1', 'soil_2'])).toBe(true);
  });

  it('should return true when all steps including required are captured', () => {
    expect(areRequiredStepsCaptured([
      'soil_1', 'soil_2', 'crop_healthy', 'water_source',
    ])).toBe(true);
  });

  it('should return false when only one soil sample is captured', () => {
    expect(areRequiredStepsCaptured(['soil_1'])).toBe(false);
  });

  it('should return false when only optional steps are captured', () => {
    expect(areRequiredStepsCaptured(['crop_healthy', 'water_source'])).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(areRequiredStepsCaptured([])).toBe(false);
  });
});

describe('getNextUncapturedStep', () => {
  it('should return first step when nothing is captured', () => {
    const next = getNextUncapturedStep([]);
    expect(next?.id).toBe('soil_1');
  });

  it('should return second step when first is captured', () => {
    const next = getNextUncapturedStep(['soil_1']);
    expect(next?.id).toBe('soil_2');
  });

  it('should skip captured steps', () => {
    const next = getNextUncapturedStep(['soil_1', 'soil_2', 'crop_healthy']);
    expect(next?.id).toBe('crop_diseased');
  });

  it('should return null when all steps are captured', () => {
    const allIds = GUIDANCE_CAPTURE_STEPS.map(s => s.id);
    expect(getNextUncapturedStep(allIds)).toBeNull();
  });

  it('should respect startFrom parameter', () => {
    const next = getNextUncapturedStep([], 3);
    expect(next?.id).toBe('crop_diseased');
  });
});
