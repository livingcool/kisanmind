/**
 * PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) - Income Support Scheme
 *
 * Reference data for PM-KISAN income support scheme
 * Since the actual portal doesn't have a public API, we use hardcoded reference data
 */
import { Logger } from '../utils/logger.js';
import type { GovernmentScheme } from '../types.js';

const logger = new Logger('PM-KISAN-API');

/**
 * Get PM-KISAN scheme information
 * This is a central government scheme applicable to all states
 */
export function getPMKisanScheme(state: string): GovernmentScheme {
  logger.info(`Fetching PM-KISAN scheme data for state: ${state}`);

  return {
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    category: 'income_support',
    description: 'Central government scheme providing direct income support of ₹6,000 per year to all landholding farmer families across India, paid in three equal installments of ₹2,000 each.',
    benefit: '₹6,000 per year (₹2,000 per installment, 3 installments)',
    eligibility: [
      'All landholding farmer families',
      'No land size restriction',
      'Aadhaar card mandatory',
      'Bank account linked with Aadhaar',
      'Excludes institutional landholders, government employees, income tax payers',
    ],
    howToApply: 'Register online at pmkisan.gov.in or visit local agriculture office with land documents, Aadhaar, and bank details. Self-registration available through Common Service Centers (CSCs).',
    deadline: null, // Ongoing scheme, no deadline
    website: 'https://pmkisan.gov.in',
    annualBenefit_INR: 6000,
  };
}

/**
 * Check PM-KISAN eligibility based on farmer profile
 */
export function checkPMKisanEligibility(
  landSize_acres?: number
): { eligible: boolean; reason: string } {
  // PM-KISAN is available to all landholding farmers regardless of size
  if (landSize_acres && landSize_acres > 0) {
    return {
      eligible: true,
      reason: 'Eligible for PM-KISAN income support (₹6,000/year)',
    };
  }

  return {
    eligible: false,
    reason: 'PM-KISAN requires land ownership documentation',
  };
}
