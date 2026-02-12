/**
 * PMFBY (Pradhan Mantri Fasal Bima Yojana) - Crop Insurance Scheme
 *
 * Reference data for PMFBY crop insurance scheme
 */
import { Logger } from '../utils/logger.js';
import type { InsuranceScheme } from '../types.js';

const logger = new Logger('PMFBY-API');

/**
 * Get PMFBY crop insurance information
 */
export function getPMFBYInsurance(state: string, crops: string[] = []): InsuranceScheme {
  logger.info(`Fetching PMFBY insurance data for state: ${state}, crops: ${crops.join(', ')}`);

  // Major crops covered under PMFBY
  const coverableCrops = [
    'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Bajra', 'Jowar',
    'Tur', 'Gram', 'Soybean', 'Groundnut', 'Sunflower', 'Sesamum',
    'Onion', 'Potato', 'Tomato', 'Chilli', 'Turmeric', 'Banana',
  ];

  return {
    name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
    description: 'Comprehensive crop insurance scheme providing financial support to farmers against crop loss due to natural calamities, pests, and diseases. Covers all stages from sowing to post-harvest.',
    premium: 'Kharif: 2% of sum insured, Rabi: 1.5% of sum insured, Horticulture/Commercial: 5% of sum insured. Balance premium subsidized by government.',
    coverage: 'Covers yield losses due to non-preventable natural risks, prevented sowing, post-harvest losses (up to 14 days), and localized calamities (hailstorm, landslide, inundation).',
    crops: coverableCrops,
    enrollmentDeadline: 'Kharif: End of July, Rabi: End of December (varies by state)',
    claimProcess: 'Claims are automatically processed based on crop cutting experiments (CCE) conducted by state agriculture department. No individual farmer needs to report loss. Payment directly to bank account.',
  };
}

/**
 * Calculate PMFBY premium estimate based on crop and land size
 */
export function calculatePMFBYPremium(
  crop: string,
  landSize_acres: number,
  sumInsured_per_acre: number = 30000
): { premium_INR: number; coverage_INR: number; governmentSubsidy_INR: number } {
  const totalSumInsured = sumInsured_per_acre * landSize_acres;

  // Determine premium rate based on crop type
  let farmerPremiumRate = 0.02; // Default 2% for Kharif
  const cropLower = crop.toLowerCase();

  if (['wheat', 'gram', 'chickpea', 'mustard'].some(c => cropLower.includes(c))) {
    farmerPremiumRate = 0.015; // 1.5% for Rabi
  } else if (['cotton', 'sugarcane', 'banana', 'pomegranate'].some(c => cropLower.includes(c))) {
    farmerPremiumRate = 0.05; // 5% for horticulture/commercial
  }

  const farmerPremium = totalSumInsured * farmerPremiumRate;

  // Actual premium is typically 12-15% of sum insured (varies by risk)
  // Government pays the difference
  const actualPremiumRate = 0.12;
  const actualPremium = totalSumInsured * actualPremiumRate;
  const governmentSubsidy = actualPremium - farmerPremium;

  return {
    premium_INR: Math.round(farmerPremium),
    coverage_INR: Math.round(totalSumInsured),
    governmentSubsidy_INR: Math.round(governmentSubsidy),
  };
}

/**
 * Check PMFBY eligibility
 */
export function checkPMFBYEligibility(
  crops?: string[],
  landSize_acres?: number
): { eligible: boolean; reason: string } {
  if (crops && crops.length > 0 && landSize_acres && landSize_acres > 0) {
    return {
      eligible: true,
      reason: 'Eligible for PMFBY crop insurance. Enroll before sowing season deadline.',
    };
  }

  return {
    eligible: false,
    reason: 'PMFBY requires crop selection and land ownership',
  };
}
