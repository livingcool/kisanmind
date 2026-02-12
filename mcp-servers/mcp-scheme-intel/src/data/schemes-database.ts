/**
 * Comprehensive database of Indian government agricultural schemes
 * Sources: Ministry of Agriculture, PM-KISAN portal, PMFBY guidelines, state portals
 *
 * Note: Scheme details change frequently. Always recommend farmers
 * verify at local agriculture office before applying.
 */

import type { GovernmentScheme, InsuranceScheme, SubsidyInfo, CreditFacility } from '../types.js';

/**
 * Central government schemes available pan-India
 */
export const CENTRAL_SCHEMES: GovernmentScheme[] = [
  {
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    category: 'income_support',
    description: 'Direct income support of INR 6,000 per year to all landholding farmer families, paid in 3 installments of INR 2,000 each.',
    benefit: 'INR 6,000/year (INR 2,000 every 4 months) directly to bank account',
    eligibility: [
      'All landholding farmer families',
      'Must have cultivable land registered in name',
      'Aadhaar linked bank account required',
      'Not for institutional landholders or tax payers',
    ],
    howToApply: 'Visit pmkisan.gov.in or Common Service Centre (CSC). Local patwari/lekhpal can assist.',
    deadline: 'Open enrollment year-round',
    website: 'https://pmkisan.gov.in',
    annualBenefit_INR: 6000,
  },
  {
    name: 'PM-KISAN Maan Dhan (Pension Scheme)',
    category: 'income_support',
    description: 'Voluntary pension scheme for small and marginal farmers. INR 3,000/month pension after age 60.',
    benefit: 'INR 3,000/month pension after age 60',
    eligibility: [
      'Small and marginal farmers (land up to 2 hectares)',
      'Age between 18-40 years',
      'Monthly contribution of INR 55-200 based on age of entry',
    ],
    howToApply: 'Register at Common Service Centre (CSC) with Aadhaar and bank details.',
    deadline: 'Open enrollment',
    website: 'https://pmkisan.gov.in/ManDhan.aspx',
    annualBenefit_INR: 36000,
  },
  {
    name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
    category: 'insurance',
    description: 'Comprehensive crop insurance at subsidized premiums. Covers yield losses from natural calamities, pests, and diseases.',
    benefit: 'Full sum insured coverage. Farmer pays only 2% premium for kharif, 1.5% for rabi, 5% for commercial crops.',
    eligibility: [
      'All farmers growing notified crops in notified areas',
      'Both loanee and non-loanee farmers',
      'Land records and sowing certificate required',
    ],
    howToApply: 'Apply through bank (if loanee) or CSC/insurance company portal. Deadline is 7 days before cut-off date.',
    deadline: 'Kharif: July 31, Rabi: December 31 (varies by state)',
    website: 'https://pmfby.gov.in',
    annualBenefit_INR: null,
  },
  {
    name: 'Soil Health Card Scheme',
    category: 'training',
    description: 'Free soil testing and health card with crop-wise fertilizer recommendations for every farm.',
    benefit: 'Free soil testing, personalized fertilizer recommendations, can save INR 2,000-5,000/acre on fertilizers',
    eligibility: [
      'All farmers',
      'No documents needed',
    ],
    howToApply: 'Contact local KVK (Krishi Vigyan Kendra) or Agriculture Department office. Soil sample will be collected from your farm.',
    deadline: 'Available year-round',
    website: 'https://soilhealth.dac.gov.in',
    annualBenefit_INR: 3000,
  },
  {
    name: 'PMKSY (Pradhan Mantri Krishi Sinchai Yojana) - Per Drop More Crop',
    category: 'irrigation',
    description: 'Subsidy for micro-irrigation (drip and sprinkler) systems to improve water use efficiency.',
    benefit: '55% subsidy for small/marginal farmers, 45% for others on drip/sprinkler systems',
    eligibility: [
      'All farmers with own/leased land',
      'Land must have water source',
      'Small/marginal farmers get higher subsidy',
    ],
    howToApply: 'Apply through State Agriculture/Horticulture Department or online portal.',
    deadline: 'Applications accepted throughout the year',
    website: 'https://pmksy.gov.in',
    annualBenefit_INR: 50000,
  },
  {
    name: 'National Mission on Sustainable Agriculture (NMSA)',
    category: 'subsidy',
    description: 'Promotes sustainable farming through soil health management, organic farming support, and climate adaptation.',
    benefit: 'Subsidy on organic inputs, vermicompost units, water harvesting structures',
    eligibility: [
      'All farmers',
      'Priority to rainfed and dryland areas',
    ],
    howToApply: 'Contact District Agriculture Officer or ATMA (Agricultural Technology Management Agency).',
    deadline: 'Project-based, check with district office',
    website: 'https://nmsa.dac.gov.in',
    annualBenefit_INR: 25000,
  },
  {
    name: 'Kisan Credit Card (KCC)',
    category: 'credit',
    description: 'Easy credit for crop production, post-harvest expenses, and allied activities at 4% interest (with interest subvention).',
    benefit: 'Crop loan up to INR 3 lakh at 4% interest. Higher limits for larger farms.',
    eligibility: [
      'All farmers - individual or joint',
      'Tenant farmers, sharecroppers, SHGs',
      'Must have land records or tenancy agreement',
    ],
    howToApply: 'Apply at any bank branch (commercial, cooperative, or RRB) with land records and ID proof.',
    deadline: 'Available year-round',
    website: 'https://www.nabard.org',
    annualBenefit_INR: null,
  },
  {
    name: 'e-NAM (National Agriculture Market)',
    category: 'marketing',
    description: 'Online trading platform connecting mandis across India. Farmers get better prices through competitive bidding.',
    benefit: 'Access to buyers across India, transparent pricing, online payment',
    eligibility: [
      'All farmers',
      'Must register with local mandi',
      'Aadhaar and bank account needed',
    ],
    howToApply: 'Register at local e-NAM mandi or at enam.gov.in. Free registration.',
    deadline: 'Open enrollment',
    website: 'https://enam.gov.in',
    annualBenefit_INR: null,
  },
  {
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    category: 'subsidy',
    description: 'Subsidy on farm machinery and equipment including tractors, harvesters, and implements.',
    benefit: '40-50% subsidy on farm machinery (up to INR 1,25,000 for power tillers, higher for other equipment)',
    eligibility: [
      'All farmers',
      'SC/ST and small/marginal farmers get higher subsidy',
      'Custom Hiring Centres also eligible',
    ],
    howToApply: 'Apply on DBT Agriculture portal (agrimachinery.nic.in) of your state.',
    deadline: 'Check state portal for current season',
    website: 'https://agrimachinery.nic.in',
    annualBenefit_INR: 75000,
  },
];

/**
 * State-specific schemes for major agricultural states
 */
export const STATE_SCHEMES: Record<string, GovernmentScheme[]> = {
  'Maharashtra': [
    {
      name: 'Mahatma Jyotiba Phule Shetkari Karj Mukti Yojana',
      category: 'credit',
      description: 'Farm loan waiver scheme for small and marginal farmers in Maharashtra.',
      benefit: 'Loan waiver up to INR 2,00,000 for eligible farmers',
      eligibility: ['Small and marginal farmers', 'Crop loan from nationalized/cooperative bank', 'Must not be defaulter on non-agricultural loan'],
      howToApply: 'Apply through local bank or tehsil office. Check mahafarmer.gov.in.',
      deadline: 'Check current status with district office',
      website: 'https://mahafarmer.gov.in',
      annualBenefit_INR: 200000,
    },
    {
      name: 'Nanaji Deshmukh Krushi Sanjivani Yojana (PoCRA)',
      category: 'irrigation',
      description: 'Climate-resilient agriculture project for drought-prone areas of Maharashtra. Farm ponds, micro-irrigation, and more.',
      benefit: 'Up to INR 75,000 for farm pond, 55% subsidy on micro-irrigation',
      eligibility: ['Farmers in project districts (Marathwada, Vidarbha, North Maharashtra)', 'Small and marginal farmers preferred'],
      howToApply: 'Apply through MAHA-DBT portal (mahadbt.maharashtra.gov.in).',
      deadline: 'Rolling applications',
      website: 'https://mahapocra.gov.in',
      annualBenefit_INR: 75000,
    },
  ],
  'Madhya Pradesh': [
    {
      name: 'Mukhyamantri Kisan Kalyan Yojana',
      category: 'income_support',
      description: 'Additional income support of INR 4,000/year on top of PM-KISAN for MP farmers.',
      benefit: 'INR 4,000/year in 2 installments of INR 2,000 each',
      eligibility: ['All PM-KISAN beneficiaries in Madhya Pradesh'],
      howToApply: 'Automatic enrollment for PM-KISAN beneficiaries. No separate application needed.',
      deadline: 'Automatic',
      website: 'https://mpkrishi.mp.gov.in',
      annualBenefit_INR: 4000,
    },
  ],
  'Telangana': [
    {
      name: 'Rythu Bandhu',
      category: 'income_support',
      description: 'Investment support of INR 10,000 per acre per season for all landholding farmers.',
      benefit: 'INR 10,000/acre/season (INR 20,000/acre/year) directly to bank account',
      eligibility: ['All landholding farmers in Telangana', 'No ceiling on land area'],
      howToApply: 'Automatic payment to registered farmers. Register at local MRO office.',
      deadline: 'Automatic seasonal payment',
      website: 'https://rythubandhu.telangana.gov.in',
      annualBenefit_INR: 20000,
    },
  ],
  'Andhra Pradesh': [
    {
      name: 'YSR Rythu Bharosa',
      category: 'income_support',
      description: 'Investment support of INR 13,500 per year for farmers in AP, combining state and PM-KISAN benefits.',
      benefit: 'INR 13,500/year (INR 7,500 state + INR 6,000 PM-KISAN)',
      eligibility: ['All farmers in AP with cultivable land', 'Must be PM-KISAN beneficiary'],
      howToApply: 'Apply at village/ward secretariat or through Meeseva centers.',
      deadline: 'Open enrollment',
      website: 'https://ysrrythubharosa.ap.gov.in',
      annualBenefit_INR: 13500,
    },
  ],
};

/**
 * Insurance schemes
 */
export const INSURANCE_SCHEMES: InsuranceScheme[] = [
  {
    name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
    description: 'Comprehensive crop insurance covering yield losses from natural calamities.',
    premium: 'Kharif: 2% of sum insured, Rabi: 1.5%, Commercial/Horticultural: 5%',
    coverage: 'Full sum insured for crop loss due to flood, drought, hail, pest, disease',
    crops: ['All notified food crops', 'Oilseeds', 'Pulses', 'Commercial crops'],
    enrollmentDeadline: 'Kharif: July 31, Rabi: December 31',
    claimProcess: 'Report crop loss within 72 hours. Crop cutting experiments determine payout.',
  },
  {
    name: 'Restructured Weather Based Crop Insurance (RWBCIS)',
    description: 'Weather-parameter based insurance. Automatic payout when weather triggers are breached.',
    premium: 'Same as PMFBY',
    coverage: 'Automatic payout based on weather deviations (rainfall, temperature, humidity)',
    crops: ['Notified crops in notified areas'],
    enrollmentDeadline: 'Same as PMFBY deadlines',
    claimProcess: 'Automatic payout when weather station records breach triggers. No claim filing needed.',
  },
];

/**
 * Subsidy programs
 */
export const SUBSIDIES: SubsidyInfo[] = [
  {
    name: 'Micro Irrigation Subsidy (PMKSY)',
    subsidy_percent: 55,
    maxAmount_INR: 100000,
    forWhat: 'Drip irrigation, sprinkler systems, micro-sprinklers',
    eligibility: 'All farmers with water source. 55% for small/marginal, 45% for others.',
    howToApply: 'Apply on State Agriculture Department portal with land records and quotation from empaneled supplier.',
  },
  {
    name: 'Farm Pond Subsidy',
    subsidy_percent: 75,
    maxAmount_INR: 75000,
    forWhat: 'Farm pond construction for rainwater harvesting',
    eligibility: 'Farmers in rainfed/drought-prone areas. Priority for SC/ST farmers.',
    howToApply: 'Apply through MGNREGA or State Watershed Department.',
  },
  {
    name: 'Solar Pump Subsidy (PM-KUSUM)',
    subsidy_percent: 60,
    maxAmount_INR: 200000,
    forWhat: 'Solar water pumps (2HP-10HP) for irrigation',
    eligibility: 'All farmers. Special incentive for replacing diesel pumps.',
    howToApply: 'Apply on mnre.gov.in or state DISCOM portal. 30% CFA + 30% state subsidy.',
  },
  {
    name: 'Seed Subsidy',
    subsidy_percent: 50,
    maxAmount_INR: 5000,
    forWhat: 'Certified/foundation seeds of improved varieties',
    eligibility: 'All farmers purchasing from government agencies.',
    howToApply: 'Purchase from State Seed Corporation or National Seeds Corporation outlets.',
  },
  {
    name: 'Organic Farming Subsidy (Paramparagat Krishi Vikas Yojana)',
    subsidy_percent: 100,
    maxAmount_INR: 50000,
    forWhat: 'Organic inputs, certification, and marketing support for 3 years',
    eligibility: 'Group of 50+ farmers forming a cluster. Each farmer gets INR 50,000 over 3 years.',
    howToApply: 'Form a farmer group and apply through District Agriculture Officer.',
  },
];

/**
 * Credit facilities
 */
export const CREDIT_FACILITIES: CreditFacility[] = [
  {
    name: 'Kisan Credit Card (KCC)',
    provider: 'All commercial, cooperative, and regional rural banks',
    interestRate: '4% per annum (with interest subvention of 3% for timely repayment)',
    maxAmount: 'Up to INR 3,00,000 for crop loans. Higher with collateral.',
    purpose: 'Crop production, post-harvest, farm maintenance, allied activities',
    eligibility: 'All farmers with land records. Also for tenant farmers and sharecroppers.',
  },
  {
    name: 'NABARD Refinance for Agriculture',
    provider: 'Through cooperative banks and RRBs',
    interestRate: '7-9% per annum',
    maxAmount: 'Based on project cost',
    purpose: 'Farm mechanization, irrigation, cold storage, food processing',
    eligibility: 'Farmers and farmer groups with bankable project proposals.',
  },
  {
    name: 'Mudra Loan (Shishu/Kishore/Tarun)',
    provider: 'All banks, MFIs, NBFCs',
    interestRate: '8-12% per annum (varies by lender)',
    maxAmount: 'Shishu: INR 50,000, Kishore: INR 5 lakh, Tarun: INR 10 lakh',
    purpose: 'Agriculture-allied activities (dairy, poultry, fishery, food processing)',
    eligibility: 'Any individual for income-generating agricultural activity. No collateral for Shishu.',
  },
];

/**
 * Approximate state from coordinates
 */
export function approximateState(lat: number, lng: number): string {
  const stateRegions: Array<{ state: string; latMin: number; latMax: number; lngMin: number; lngMax: number }> = [
    { state: 'Maharashtra', latMin: 15.6, latMax: 22.0, lngMin: 72.6, lngMax: 80.9 },
    { state: 'Madhya Pradesh', latMin: 21.0, latMax: 26.9, lngMin: 74.0, lngMax: 82.8 },
    { state: 'Rajasthan', latMin: 23.0, latMax: 30.2, lngMin: 69.5, lngMax: 78.3 },
    { state: 'Uttar Pradesh', latMin: 23.9, latMax: 30.4, lngMin: 77.1, lngMax: 84.6 },
    { state: 'Punjab', latMin: 29.5, latMax: 32.5, lngMin: 73.8, lngMax: 77.0 },
    { state: 'Karnataka', latMin: 11.6, latMax: 18.4, lngMin: 74.0, lngMax: 78.6 },
    { state: 'Andhra Pradesh', latMin: 12.4, latMax: 19.1, lngMin: 77.0, lngMax: 84.8 },
    { state: 'Tamil Nadu', latMin: 8.1, latMax: 13.6, lngMin: 76.2, lngMax: 80.3 },
    { state: 'Telangana', latMin: 15.8, latMax: 19.9, lngMin: 77.3, lngMax: 81.3 },
    { state: 'Gujarat', latMin: 20.1, latMax: 24.7, lngMin: 68.2, lngMax: 74.5 },
  ];

  for (const region of stateRegions) {
    if (lat >= region.latMin && lat <= region.latMax && lng >= region.lngMin && lng <= region.lngMax) {
      return region.state;
    }
  }
  return 'India';
}
