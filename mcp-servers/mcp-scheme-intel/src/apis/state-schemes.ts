/**
 * State-Specific Agricultural Schemes
 *
 * Reference data for state government schemes, subsidies, and programs
 */
import { Logger } from '../utils/logger.js';
import type { GovernmentScheme, SubsidyInfo, CreditFacility } from '../types.js';

const logger = new Logger('StateSchemes-API');

/**
 * Get state-specific schemes based on location
 */
export function getStateSchemesData(state: string): {
  schemes: GovernmentScheme[];
  subsidies: SubsidyInfo[];
  creditFacilities: CreditFacility[];
} {
  logger.info(`Fetching state schemes for: ${state}`);

  const schemes: GovernmentScheme[] = [];
  const subsidies: SubsidyInfo[] = [];
  const creditFacilities: CreditFacility[] = [];

  // Add common schemes available in all states
  schemes.push(...getCommonSchemes());
  subsidies.push(...getCommonSubsidies());
  creditFacilities.push(...getCommonCreditFacilities());

  // Add state-specific schemes
  switch (state) {
    case 'Maharashtra':
      schemes.push(...getMaharashtraSchemes());
      subsidies.push(...getMaharashtraSubsidies());
      break;
    case 'Punjab':
      schemes.push(...getPunjabSchemes());
      break;
    case 'Uttar Pradesh':
      schemes.push(...getUttarPradeshSchemes());
      break;
    case 'Karnataka':
      schemes.push(...getKarnatakaSchemes());
      break;
    case 'Tamil Nadu':
      schemes.push(...getTamilNaduSchemes());
      break;
    case 'Madhya Pradesh':
      schemes.push(...getMadhyaPradeshSchemes());
      break;
    default:
      logger.info(`Using default schemes for state: ${state}`);
  }

  return { schemes, subsidies, creditFacilities };
}

/**
 * Common schemes available across all states
 */
function getCommonSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Soil Health Card Scheme',
      category: 'subsidy',
      description: 'Free soil testing and nutrient management advice provided to farmers every 2-3 years.',
      benefit: 'Free soil testing report with fertilizer recommendations',
      eligibility: ['All farmers with agricultural land'],
      howToApply: 'Contact local agriculture department or Krishi Vigyan Kendra (KVK) for soil sample collection',
      deadline: null,
      website: 'https://soilhealth.dac.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Kisan Credit Card (KCC)',
      category: 'credit',
      description: 'Credit card for farmers to meet short-term crop production and consumption needs, with interest subvention.',
      benefit: 'Collateral-free credit up to ₹3 lakh, 2% interest subvention, additional 3% prompt repayment incentive',
      eligibility: ['Farmers owning or cultivating land', 'Tenant farmers, oral lessees, sharecroppers'],
      howToApply: 'Apply at any commercial bank, regional rural bank, or cooperative bank with land documents and Aadhaar',
      deadline: null,
      website: 'https://www.nabard.org',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Common subsidies available across states
 */
function getCommonSubsidies(): SubsidyInfo[] {
  return [
    {
      name: 'Drip Irrigation Subsidy (PMKSY)',
      subsidy_percent: 55,
      maxAmount_INR: 40000,
      forWhat: 'Drip irrigation system installation for water conservation',
      eligibility: 'Small and marginal farmers get 55% subsidy, other farmers get 45% subsidy',
      howToApply: 'Apply through state agriculture department or district horticulture office with land documents',
    },
    {
      name: 'Solar Pump Subsidy (PM-KUSUM)',
      subsidy_percent: 60,
      maxAmount_INR: 120000,
      forWhat: 'Installation of solar-powered irrigation pumps (up to 7.5 HP)',
      eligibility: 'All farmers with agricultural land and adequate water source',
      howToApply: 'Apply through state nodal agency or DISCOM with land ownership proof',
    },
    {
      name: 'Farm Mechanization Subsidy',
      subsidy_percent: 50,
      maxAmount_INR: 80000,
      forWhat: 'Purchase of tractors, power tillers, harvesters, and other farm equipment',
      eligibility: 'Small and marginal farmers, SC/ST farmers get higher subsidy',
      howToApply: 'Apply through state agriculture department with Aadhaar and land records',
    },
    {
      name: 'National Horticulture Mission (NHM)',
      subsidy_percent: 50,
      maxAmount_INR: 100000,
      forWhat: 'High-tech horticulture cultivation, protected cultivation, tissue culture',
      eligibility: 'All farmers engaged in horticulture activities',
      howToApply: 'Contact district horticulture officer with project proposal',
    },
  ];
}

/**
 * Common credit facilities
 */
function getCommonCreditFacilities(): CreditFacility[] {
  return [
    {
      name: 'Kisan Credit Card (KCC)',
      provider: 'All commercial banks, RRBs, Cooperative banks',
      interestRate: '7% (with 2% subvention + 3% prompt repayment = effective 2%)',
      maxAmount: '₹3 lakh (collateral-free), higher amounts with collateral',
      purpose: 'Crop production, consumption needs, farm maintenance',
      eligibility: 'All farmers with land ownership or cultivation proof',
    },
    {
      name: 'NABARD Dairy Entrepreneurship Development Scheme',
      provider: 'NABARD through commercial banks',
      interestRate: '8-10% with subsidy component',
      maxAmount: '₹33.30 lakh (10 animal unit), capital subsidy 25-33%',
      purpose: 'Dairy farming, milk production and processing',
      eligibility: 'Individual farmers, SHGs, JLGs with dairy project plan',
    },
  ];
}

/**
 * Maharashtra-specific schemes
 */
function getMaharashtraSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Jalyukt Shivar Abhiyan',
      category: 'irrigation',
      description: 'Comprehensive water conservation program for drought-prone areas, focusing on watershed management and water harvesting.',
      benefit: 'Free technical support and subsidized construction of farm ponds, check dams, and water harvesting structures',
      eligibility: ['Farmers in drought-prone districts', 'Village watershed committees'],
      howToApply: 'Contact district collector office or village panchayat for village-level water conservation projects',
      deadline: null,
      website: 'https://www.maharashtra.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Magel Tyala Shet Tala (Farm to the Farmer)',
      category: 'subsidy',
      description: 'Land purchase subsidy scheme for landless agricultural laborers to enable land ownership.',
      benefit: '₹1.5 lakh subsidy for land purchase',
      eligibility: ['Landless agricultural laborers', 'SC/ST priority', 'Below poverty line'],
      howToApply: 'Apply through Tahsildar office with income certificate and caste certificate',
      deadline: 'Subject to annual budget allocation',
      website: 'https://aaplesarkar.mahaonline.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Maharashtra-specific subsidies
 */
function getMaharashtraSubsidies(): SubsidyInfo[] {
  return [
    {
      name: 'Maharashtra Krishi Pump Electricity Connection Subsidy',
      subsidy_percent: 100,
      maxAmount_INR: 25000,
      forWhat: 'New agricultural electricity connection for irrigation',
      eligibility: 'Small and marginal farmers with 7.5 HP or lower pump capacity',
      howToApply: 'Apply through MSEDCL with land documents and agriculture certificate',
    },
  ];
}

/**
 * Punjab-specific schemes
 */
function getPunjabSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Direct Benefit Transfer (DBT) for Paddy',
      category: 'income_support',
      description: 'Direct cash transfer to farmers for paddy cultivation to promote crop diversification',
      benefit: 'Variable incentive per acre for diversifying away from paddy',
      eligibility: ['Farmers cultivating paddy', 'Registered on Punjab Farmers Portal'],
      howToApply: 'Register on Punjab Farmers and Arthiyas Registration Portal',
      deadline: 'Before sowing season',
      website: 'https://www.pbagri.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Uttar Pradesh-specific schemes
 */
function getUttarPradeshSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'UP Kisan Kalyan Mission',
      category: 'subsidy',
      description: 'Integrated agricultural development program with subsidies on seeds, fertilizers, and equipment',
      benefit: 'Up to 50% subsidy on certified seeds and bio-fertilizers',
      eligibility: ['All farmers registered on UP Agriculture Portal'],
      howToApply: 'Register on upagriculture.com and apply through district agriculture office',
      deadline: null,
      website: 'http://upagriculture.com',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Karnataka-specific schemes
 */
function getKarnatakaSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Raita Shakti',
      category: 'subsidy',
      description: 'Comprehensive farm mechanization scheme with subsidized equipment rental',
      benefit: 'Custom hiring centers for farm equipment at subsidized rates',
      eligibility: ['All farmers in Karnataka'],
      howToApply: 'Contact nearest Custom Hiring Center or district agriculture office',
      deadline: null,
      website: 'https://raitamitra.karnataka.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Tamil Nadu-specific schemes
 */
function getTamilNaduSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'TN Free Electricity for Agriculture',
      category: 'subsidy',
      description: 'Free electricity for agricultural pump sets',
      benefit: 'Free electricity for agricultural operations (limitations apply)',
      eligibility: ['Farmers with registered agricultural electricity connections'],
      howToApply: 'Automatic benefit for registered agricultural connections',
      deadline: null,
      website: 'https://www.tnagr.tn.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Madhya Pradesh-specific schemes
 */
function getMadhyaPradeshSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Mukhyamantri Kisan Kalyan Yojana',
      category: 'income_support',
      description: 'State government income support scheme complementing PM-KISAN',
      benefit: '₹4,000 per year in two installments of ₹2,000 each',
      eligibility: ['All farmers eligible for PM-KISAN in Madhya Pradesh'],
      howToApply: 'Automatic enrollment if registered under PM-KISAN',
      deadline: null,
      website: 'https://mpkrishi.mp.gov.in',
      annualBenefit_INR: 4000,
    },
  ];
}
