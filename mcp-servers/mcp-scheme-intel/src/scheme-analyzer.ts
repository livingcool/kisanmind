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
 * Safely retrieve state-specific schemes with graceful fallback.
 * Returns an empty array (not an error) when a state has no specific scheme data.
 */
function getStateSchemes(stateName: string): GovernmentScheme[] {
  const schemes = STATE_SCHEMES[stateName];

  if (schemes) {
    return schemes;
  }

  // Log missing state data for future expansion
  logger.warn(`[Scheme Analyzer] No specific schemes for state: ${stateName}, using central schemes only`);

  // Return empty array - central schemes will still be included
  return [];
}

/**
 * Filter schemes based on farmer profile
 */
function filterEligibleSchemes(
  profile: FarmerProfile,
  state: string
): GovernmentScheme[] {
  const schemes: GovernmentScheme[] = [...CENTRAL_SCHEMES];

  // Add state-specific schemes (graceful fallback if state not found)
  const stateSchemes = getStateSchemes(state);
  schemes.push(...stateSchemes);

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

  // State-specific recommendations
  const stateRecs: Record<string, string> = {
    'Maharashtra': 'Maharashtra farmers: Check MAHA-DBT portal for additional state subsidies (mahadbt.maharashtra.gov.in).',
    'Telangana': 'Telangana farmers: Ensure Rythu Bandhu registration is active for INR 10,000/acre/season support.',
    'Andhra Pradesh': 'AP farmers: Visit your nearest RBK (Rythu Bharosa Kendra) for YSR Rythu Bharosa and free crop insurance.',
    'Tamil Nadu': 'Tamil Nadu farmers: Register at Uzhavar Sandhai for direct market access and better prices.',
    'Karnataka': 'Karnataka farmers: Check Raita Mitra portal (raitamitra.karnataka.gov.in) for all state schemes.',
    'Uttar Pradesh': 'UP farmers: Register on upagriculture.com for seed and fertilizer subsidies.',
    'Gujarat': 'Gujarat farmers: Use i-Khedut portal (ikhedut.gujarat.gov.in) for all subsidy applications.',
    'Punjab': 'Punjab farmers: Register on Punjab Farmers Portal for crop diversification incentives.',
    'Haryana': 'Haryana farmers: Register on Meri Fasal Mera Byora (fasal.haryana.gov.in) for MSP procurement.',
    'Madhya Pradesh': 'MP farmers: PM-KISAN beneficiaries automatically get extra INR 4,000/year from Mukhyamantri Kisan Kalyan Yojana.',
    'Rajasthan': 'Rajasthan farmers: Apply for water harvesting subsidy at rajkisan.rajasthan.gov.in.',
    'West Bengal': 'West Bengal farmers: Register for Krishak Bandhu scheme at krishakbandhu.net.',
    'Bihar': 'Bihar farmers: Apply at dbtagriculture.bihar.gov.in for diesel subsidy and input support.',
    'Odisha': 'Odisha farmers: Apply for KALIA scheme at kalia.odisha.gov.in for cultivation support.',
    'Chhattisgarh': 'Chhattisgarh farmers: Register for Rajiv Gandhi Kisan Nyay Yojana for input subsidy.',
    'Jharkhand': 'Jharkhand farmers: Verify Mukhyamantri Krishi Ashirwad Yojana enrollment at block office.',
    'Kerala': 'Kerala farmers: Visit your local Krishi Bhavan for crop insurance and subsidized inputs.',
    'Assam': 'Assam farmers: Contact district agriculture office for CMSGUY mechanization support.',
  };

  const stateRec = stateRecs[state];
  if (stateRec) {
    recs.push(stateRec);
  } else if (state !== 'India') {
    // Graceful fallback for states without specific scheme data
    recs.push(
      `State-specific scheme data for ${state} is being updated. ` +
      'Please check with your local agriculture office for additional state-level schemes and subsidies. ' +
      'Central government schemes (PM-KISAN, PMFBY, KCC) are available in all states.'
    );
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
