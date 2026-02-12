/**
 * Scheme Analyzer - Matches farmer profile to eligible government schemes,
 * subsidies, insurance, and credit facilities
 */
import { Logger } from './utils/logger.js';
import {
  CENTRAL_SCHEMES,
  STATE_SCHEMES,
  INSURANCE_SCHEMES,
  SUBSIDIES,
  CREDIT_FACILITIES,
  approximateState,
} from './data/schemes-database.js';
import type {
  SchemeAnalysisResult,
  GovernmentScheme,
  ApplicationStep,
  FarmerProfile,
} from './types.js';

const logger = new Logger('SchemeAnalyzer');

/**
 * Filter schemes based on farmer profile
 */
function filterEligibleSchemes(
  profile: FarmerProfile,
  state: string
): GovernmentScheme[] {
  const schemes: GovernmentScheme[] = [...CENTRAL_SCHEMES];

  // Add state-specific schemes
  const stateSchemes = STATE_SCHEMES[state];
  if (stateSchemes) {
    schemes.push(...stateSchemes);
  }

  // Filter based on farmer category
  const category = profile.landSize_acres !== undefined
    ? profile.landSize_acres <= 2.5 ? 'small'
      : profile.landSize_acres <= 5 ? 'marginal'
        : profile.landSize_acres <= 10 ? 'medium'
          : 'large'
    : 'small';

  // All central schemes are available to all farmers
  // Filter state schemes based on eligibility
  return schemes.map(scheme => {
    // Add category-specific notes
    if (category === 'small' || category === 'marginal') {
      return {
        ...scheme,
        benefit: scheme.benefit + (scheme.category === 'subsidy' ? ' (higher subsidy rate for small/marginal farmers)' : ''),
      };
    }
    return scheme;
  });
}

/**
 * Generate application timeline - what to apply for and when
 */
function generateApplicationTimeline(
  _schemes: GovernmentScheme[],
  state: string
): ApplicationStep[] {
  const steps: ApplicationStep[] = [];
  let stepNum = 1;

  // Priority 1: PM-KISAN (if not already enrolled)
  steps.push({
    step: stepNum++,
    scheme: 'PM-KISAN',
    action: 'Register for PM-KISAN if not already enrolled. Get INR 6,000/year income support.',
    where: 'pmkisan.gov.in or nearest Common Service Centre (CSC)',
    deadline: 'ASAP - open enrollment',
    documents: ['Aadhaar card', 'Bank passbook', 'Land records (7/12 extract or khasra)', 'Mobile number'],
  });

  // Priority 2: KCC
  steps.push({
    step: stepNum++,
    scheme: 'Kisan Credit Card',
    action: 'Apply for KCC to get crop loan at 4% interest rate.',
    where: 'Nearest bank branch (any nationalized, cooperative, or RRB)',
    deadline: 'Apply before sowing season',
    documents: ['Aadhaar card', 'Land records', 'Passport photos', 'Bank account details'],
  });

  // Priority 3: Crop Insurance
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 4 && currentMonth <= 7) {
    // Kharif season enrollment
    steps.push({
      step: stepNum++,
      scheme: 'PMFBY (Kharif)',
      action: 'Enroll for kharif crop insurance. Premium is only 2% of sum insured.',
      where: 'Bank branch (if KCC holder) or pmfby.gov.in or CSC',
      deadline: 'July 31 (check state notification)',
      documents: ['Land records', 'Sowing certificate from patwari', 'Bank account', 'Aadhaar'],
    });
  } else if (currentMonth >= 9 || currentMonth <= 1) {
    // Rabi season enrollment
    steps.push({
      step: stepNum++,
      scheme: 'PMFBY (Rabi)',
      action: 'Enroll for rabi crop insurance. Premium is only 1.5% of sum insured.',
      where: 'Bank branch (if KCC holder) or pmfby.gov.in or CSC',
      deadline: 'December 31 (check state notification)',
      documents: ['Land records', 'Sowing certificate from patwari', 'Bank account', 'Aadhaar'],
    });
  }

  // Priority 4: Micro-irrigation subsidy
  steps.push({
    step: stepNum++,
    scheme: 'PMKSY Micro-Irrigation',
    action: 'Apply for 55% subsidy on drip/sprinkler irrigation system.',
    where: 'State Agriculture/Horticulture Department portal',
    deadline: 'Applications accepted year-round',
    documents: ['Land records', 'Water source proof', 'Quotation from empaneled supplier', 'Bank account', 'Aadhaar'],
  });

  // Priority 5: Soil Health Card
  steps.push({
    step: stepNum++,
    scheme: 'Soil Health Card',
    action: 'Get free soil testing done for fertilizer recommendations.',
    where: 'Nearest KVK (Krishi Vigyan Kendra) or Agriculture Department',
    deadline: 'Available year-round',
    documents: ['No documents needed - just visit with farm location details'],
  });

  // State-specific steps
  if (state === 'Maharashtra') {
    steps.push({
      step: stepNum++,
      scheme: 'PoCRA (Nanaji Deshmukh Krushi Sanjivani)',
      action: 'Apply for farm pond or climate-resilient agriculture support.',
      where: 'mahadbt.maharashtra.gov.in',
      deadline: 'Rolling applications',
      documents: ['7/12 extract', 'Aadhaar', 'Bank account', 'Caste certificate (if SC/ST)'],
    });
  }

  // e-NAM registration
  steps.push({
    step: stepNum++,
    scheme: 'e-NAM',
    action: 'Register on e-NAM for access to online crop trading across India.',
    where: 'Local e-NAM enabled mandi or enam.gov.in',
    deadline: 'Register before selling season',
    documents: ['Aadhaar', 'Bank account', 'Mandi license or farmer ID'],
  });

  return steps;
}

/**
 * Calculate total potential benefit
 */
function calculateTotalBenefit(schemes: GovernmentScheme[], landSize: number): string {
  let totalAnnual = 0;
  let oneTimeSubsidy = 0;

  for (const scheme of schemes) {
    if (scheme.annualBenefit_INR) {
      if (scheme.name.includes('Rythu Bandhu')) {
        totalAnnual += scheme.annualBenefit_INR * landSize; // Per acre scheme
      } else {
        totalAnnual += scheme.annualBenefit_INR;
      }
    }
  }

  for (const subsidy of SUBSIDIES) {
    oneTimeSubsidy += subsidy.maxAmount_INR;
  }

  const parts: string[] = [];
  if (totalAnnual > 0) {
    parts.push(`Annual income support: approximately INR ${totalAnnual.toLocaleString()}`);
  }
  if (oneTimeSubsidy > 0) {
    parts.push(`One-time subsidies available: up to INR ${oneTimeSubsidy.toLocaleString()}`);
  }
  parts.push('Plus: crop loan at 4% interest, crop insurance at 2% premium');

  return parts.join('. ');
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  state: string,
  landSize: number,
  _schemes: GovernmentScheme[]
): string[] {
  const recs: string[] = [];

  recs.push('IMMEDIATE: Register for PM-KISAN if not done. This is free money (INR 6,000/year) with no repayment.');
  recs.push('IMPORTANT: Get KCC (Kisan Credit Card) from your bank - crop loan at just 4% interest saves thousands vs. moneylenders.');
  recs.push('BEFORE SOWING: Enroll in PMFBY crop insurance. Premium is just 2% but you get full coverage for crop loss.');

  if (landSize <= 5) {
    recs.push('As a small farmer, you qualify for higher subsidy rates on micro-irrigation and farm equipment.');
  }

  if (state === 'Maharashtra') {
    recs.push('Maharashtra farmers: Check MAHA-DBT portal for additional state subsidies (mahadbt.maharashtra.gov.in).');
  } else if (state === 'Telangana') {
    recs.push('Telangana farmers: Ensure Rythu Bandhu registration is active for INR 10,000/acre/season support.');
  }

  recs.push('Visit your nearest KVK (Krishi Vigyan Kendra) for free technical guidance and training programs.');
  recs.push('DISCLAIMER: Scheme details may change. Always verify eligibility and deadlines at your local agriculture office.');

  return recs;
}

/**
 * Perform comprehensive scheme analysis for a given farmer
 */
export async function analyzeSchemes(
  lat: number,
  lng: number,
  landSize: number = 3,
  crops: string[] = []
): Promise<SchemeAnalysisResult> {
  logger.info(`Starting scheme analysis for ${lat}, ${lng}, land: ${landSize} acres`);
  const startTime = Date.now();

  const state = approximateState(lat, lng);

  const profile: FarmerProfile = {
    latitude: lat,
    longitude: lng,
    state,
    landSize_acres: landSize,
    crops,
    category: landSize <= 2.5 ? 'small' : landSize <= 5 ? 'marginal' : landSize <= 10 ? 'medium' : 'large',
  };

  const eligibleSchemes = filterEligibleSchemes(profile, state);
  const applicationTimeline = generateApplicationTimeline(eligibleSchemes, state);
  const totalBenefit = calculateTotalBenefit(eligibleSchemes, landSize);
  const recommendations = generateRecommendations(state, landSize, eligibleSchemes);

  const elapsed = Date.now() - startTime;
  logger.info(`Scheme analysis completed in ${elapsed}ms`);

  return {
    status: 'success',
    location: { latitude: lat, longitude: lng, state },
    eligibleSchemes,
    insuranceSchemes: INSURANCE_SCHEMES,
    subsidies: SUBSIDIES,
    creditFacilities: CREDIT_FACILITIES,
    applicationTimeline,
    totalPotentialBenefit: totalBenefit,
    recommendations,
    dataSources: [
      'PM-KISAN portal (pmkisan.gov.in)',
      'PMFBY portal (pmfby.gov.in)',
      'Ministry of Agriculture schemes database',
      `${state} state agriculture portal`,
    ],
    timestamp: new Date().toISOString(),
  };
}
