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
  const stateSchemeProviders: Record<string, () => { schemes?: GovernmentScheme[]; subsidies?: SubsidyInfo[] }> = {
    'Maharashtra': () => ({ schemes: getMaharashtraSchemes(), subsidies: getMaharashtraSubsidies() }),
    'Punjab': () => ({ schemes: getPunjabSchemes() }),
    'Uttar Pradesh': () => ({ schemes: getUttarPradeshSchemes() }),
    'Karnataka': () => ({ schemes: getKarnatakaSchemes() }),
    'Tamil Nadu': () => ({ schemes: getTamilNaduSchemes() }),
    'Madhya Pradesh': () => ({ schemes: getMadhyaPradeshSchemes() }),
    'Gujarat': () => ({ schemes: getGujaratSchemes() }),
    'Haryana': () => ({ schemes: getHaryanaSchemes() }),
    'Rajasthan': () => ({ schemes: getRajasthanSchemes() }),
    'Telangana': () => ({ schemes: getTelanganaSchemes() }),
    'Andhra Pradesh': () => ({ schemes: getAndhraPradeshSchemes() }),
    'West Bengal': () => ({ schemes: getWestBengalSchemes() }),
    'Bihar': () => ({ schemes: getBiharSchemes() }),
    'Odisha': () => ({ schemes: getOdishaSchemes() }),
    'Chhattisgarh': () => ({ schemes: getChhattisgarhSchemes() }),
    'Jharkhand': () => ({ schemes: getJharkhandSchemes() }),
    'Assam': () => ({ schemes: getAssamSchemes() }),
    'Kerala': () => ({ schemes: getKeralaSchemes() }),
  };

  const provider = stateSchemeProviders[state];
  if (provider) {
    const result = provider();
    if (result.schemes) schemes.push(...result.schemes);
    if (result.subsidies) subsidies.push(...result.subsidies);
  } else {
    logger.warn(`[State Schemes] No specific schemes for state: ${state}, using central schemes only`);
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
 * Source: https://mpkrishi.mp.gov.in (Official MP Agriculture Portal)
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
    {
      name: 'Bhavantar Bhugtan Yojana',
      category: 'income_support',
      description: 'Price deficit payment scheme - government compensates when market price falls below MSP',
      benefit: 'Difference between MSP and market price paid directly to farmer',
      eligibility: ['All farmers in MP growing notified crops', 'Must sell through registered mandi'],
      howToApply: 'Register on mpeuparjan.nic.in and sell through registered mandi',
      deadline: 'Registration before each procurement season',
      website: 'https://mpeuparjan.nic.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Gujarat-specific schemes
 * Source: https://agri.gujarat.gov.in (Official Gujarat Agriculture Dept)
 */
function getGujaratSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Mukhyamantri Kisan Sahay Yojana',
      category: 'insurance',
      description: 'Crop insurance for natural calamities including drought, excess rainfall, and unseasonal rain',
      benefit: '₹20,000/hectare for 33-60% damage, ₹25,000/hectare for above 60% damage',
      eligibility: ['All farmers in Gujarat growing notified crops', 'No premium payment required'],
      howToApply: 'Automatic enrollment for registered farmers via eGram center or i-Khedut portal',
      deadline: 'Before kharif/rabi season',
      website: 'https://agri.gujarat.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'i-Khedut Portal Subsidy Schemes',
      category: 'subsidy',
      description: 'Comprehensive portal for Gujarat agriculture subsidies: farm equipment, irrigation, horticulture',
      benefit: '50-75% subsidy on farm equipment, drip irrigation, greenhouse, and more',
      eligibility: ['All farmers in Gujarat with Aadhaar and land records'],
      howToApply: 'Apply online at ikhedut.gujarat.gov.in',
      deadline: 'Varies by scheme - check portal',
      website: 'https://ikhedut.gujarat.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Haryana-specific schemes
 * Source: https://agriharyana.gov.in (Official Haryana Agriculture Dept)
 */
function getHaryanaSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Meri Fasal Mera Byora',
      category: 'marketing',
      description: 'Online farmer registration for MSP procurement and government scheme benefits in Haryana',
      benefit: 'Guaranteed MSP procurement, access to all state subsidies through single registration',
      eligibility: ['All farmers in Haryana'],
      howToApply: 'Register at fasal.haryana.gov.in with Aadhaar, land records, and bank details',
      deadline: 'Before each crop season',
      website: 'https://fasal.haryana.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Bhavantar Bharpai Yojana',
      category: 'income_support',
      description: 'Price deficit compensation for horticulture crops when market price falls below protected price',
      benefit: 'Compensation for difference between protected price and actual selling price',
      eligibility: ['Farmers growing notified horticulture crops', 'Must sell through designated mandis'],
      howToApply: 'Register on Meri Fasal Mera Byora portal',
      deadline: 'Before harvest season',
      website: 'https://fasal.haryana.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Rajasthan-specific schemes
 * Source: https://rajkisan.rajasthan.gov.in (Official Rajasthan Agriculture Portal)
 */
function getRajasthanSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Mukhyamantri Krishak Sathi Yojana',
      category: 'insurance',
      description: 'Financial assistance for accidental death or injury during farming activities',
      benefit: '₹2,00,000 for accidental death, ₹50,000-2,00,000 for injuries',
      eligibility: ['All farmers and agricultural laborers in Rajasthan aged 5-70 years'],
      howToApply: 'Apply through district agriculture officer within 6 months of incident',
      deadline: 'Within 6 months of incident',
      website: 'https://rajkisan.rajasthan.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Rajasthan Water Harvesting Subsidy',
      category: 'irrigation',
      description: 'Subsidy for water harvesting structures in arid/semi-arid areas',
      benefit: 'Up to 60% subsidy (max ₹1,00,000) on water harvesting structures',
      eligibility: ['Farmers in arid and semi-arid districts of Rajasthan'],
      howToApply: 'Apply through rajkisan.rajasthan.gov.in portal',
      deadline: 'Subject to annual budget allocation',
      website: 'https://rajkisan.rajasthan.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Telangana-specific schemes
 * Source: https://rythubandhu.telangana.gov.in (Official Telangana Portal)
 */
function getTelanganaSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Rythu Bandhu',
      category: 'income_support',
      description: 'Investment support of ₹10,000 per acre per season for all landholding farmers',
      benefit: '₹10,000/acre/season (₹20,000/acre/year) directly to bank account',
      eligibility: ['All landholding farmers in Telangana', 'No ceiling on land area'],
      howToApply: 'Automatic payment to registered farmers. Register at local MRO office',
      deadline: 'Automatic seasonal payment',
      website: 'https://rythubandhu.telangana.gov.in',
      annualBenefit_INR: 20000,
    },
    {
      name: 'Rythu Bima',
      category: 'insurance',
      description: 'Free life insurance of ₹5 lakh for enrolled Rythu Bandhu farmer families (age 18-59)',
      benefit: '₹5,00,000 life insurance coverage at no cost to farmer',
      eligibility: ['All Rythu Bandhu beneficiaries aged 18-59 years'],
      howToApply: 'Automatic enrollment for Rythu Bandhu beneficiaries',
      deadline: 'Automatic enrollment',
      website: 'https://rythubandhu.telangana.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Andhra Pradesh-specific schemes
 * Source: https://www.apagrisnet.gov.in (Official AP Agriculture Portal)
 */
function getAndhraPradeshSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'YSR Rythu Bharosa',
      category: 'income_support',
      description: 'Investment support of ₹13,500 per year combining state and PM-KISAN benefits',
      benefit: '₹13,500/year (₹7,500 state + ₹6,000 PM-KISAN)',
      eligibility: ['All farmers in AP with cultivable land', 'Must be PM-KISAN beneficiary'],
      howToApply: 'Apply at village/ward secretariat or Meeseva centers',
      deadline: 'Open enrollment',
      website: 'https://ysrrythubharosa.ap.gov.in',
      annualBenefit_INR: 13500,
    },
    {
      name: 'YSR Free Crop Insurance',
      category: 'insurance',
      description: 'State pays farmer share of PMFBY premium, making crop insurance free',
      benefit: 'Free crop insurance - state pays farmer premium share',
      eligibility: ['All farmers in AP enrolled in PMFBY'],
      howToApply: 'Automatic enrollment through RBKs (Rythu Bharosa Kendras)',
      deadline: 'Before sowing season',
      website: 'https://www.apagrisnet.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * West Bengal-specific schemes
 * Source: https://krishakbandhu.net (Official WB Portal)
 */
function getWestBengalSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Krishak Bandhu Scheme',
      category: 'income_support',
      description: 'Financial assistance for farming families - crop investment support and death benefit',
      benefit: '₹10,000/year for farmers with 1+ acre, ₹4,000/year for below 1 acre. ₹2,00,000 death benefit.',
      eligibility: ['All farmers in West Bengal with recorded farmland'],
      howToApply: 'Apply through Krishak Bandhu portal or block development office',
      deadline: 'Open enrollment',
      website: 'https://krishakbandhu.net',
      annualBenefit_INR: 10000,
    },
  ];
}

/**
 * Bihar-specific schemes
 * Source: https://dbtagriculture.bihar.gov.in (Official Bihar Agriculture DBT Portal)
 */
function getBiharSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Bihar Krishi Input Subsidy Scheme',
      category: 'subsidy',
      description: 'Financial assistance to farmers affected by natural calamities for crop loss',
      benefit: '₹6,800/hectare for rainfed, ₹13,500/hectare for irrigated crops (max 2 hectares)',
      eligibility: ['Farmers in declared disaster-affected areas of Bihar'],
      howToApply: 'Apply on dbtagriculture.bihar.gov.in within 15 days of declaration',
      deadline: 'Within 15 days of calamity declaration',
      website: 'https://dbtagriculture.bihar.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Bihar Diesel Subsidy Scheme',
      category: 'subsidy',
      description: 'Subsidy on diesel for irrigation during kharif and rabi seasons',
      benefit: '₹75/liter diesel subsidy for irrigation (max 10 liters/acre kharif, 8 liters rabi)',
      eligibility: ['All farmers in Bihar'],
      howToApply: 'Apply on dbtagriculture.bihar.gov.in with land records and Aadhaar',
      deadline: 'During cropping season',
      website: 'https://dbtagriculture.bihar.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Odisha-specific schemes
 * Source: https://kalia.odisha.gov.in (Official KALIA Portal)
 */
function getOdishaSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'KALIA (Krushak Assistance for Livelihood and Income Augmentation)',
      category: 'income_support',
      description: 'Financial assistance for small/marginal farmers and landless agricultural households',
      benefit: '₹4,000 per season (2 seasons) for cultivation support',
      eligibility: ['Small and marginal farmers in Odisha', 'Landless agricultural households'],
      howToApply: 'Apply through KALIA portal or block agriculture office',
      deadline: 'Before each crop season',
      website: 'https://kalia.odisha.gov.in',
      annualBenefit_INR: 8000,
    },
  ];
}

/**
 * Chhattisgarh-specific schemes
 * Source: https://rgkny.cg.nic.in (Official CG Portal)
 */
function getChhattisgarhSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Rajiv Gandhi Kisan Nyay Yojana',
      category: 'income_support',
      description: 'Input subsidy for paddy farmers and crop diversification incentive',
      benefit: '₹9,000/acre/year for paddy, ₹10,000/acre for diversification to pulses/oilseeds',
      eligibility: ['All farmers in Chhattisgarh registered for the scheme'],
      howToApply: 'Register through cooperative societies or district agriculture office',
      deadline: 'Before each season',
      website: 'https://rgkny.cg.nic.in',
      annualBenefit_INR: 9000,
    },
  ];
}

/**
 * Jharkhand-specific schemes
 * Source: https://mmkay.jharkhand.gov.in (Official Jharkhand Portal)
 */
function getJharkhandSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Mukhyamantri Krishi Ashirwad Yojana',
      category: 'income_support',
      description: 'Pre-sowing financial support for small and marginal farmers',
      benefit: '₹5,000 per acre per year (max 5 acres)',
      eligibility: ['Small and marginal farmers in Jharkhand with land up to 5 acres'],
      howToApply: 'Automatic enrollment through land records. Verify at block agriculture office',
      deadline: 'Automatic enrollment',
      website: 'https://mmkay.jharkhand.gov.in',
      annualBenefit_INR: 5000,
    },
  ];
}

/**
 * Assam-specific schemes
 * Source: https://diaboroagri.assam.gov.in (Official Assam Agriculture Portal)
 */
function getAssamSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Chief Minister Samagra Gramya Unnayan Yojana',
      category: 'subsidy',
      description: 'Integrated rural development including agriculture mechanization subsidy',
      benefit: 'Subsidized farm implements, support for organic farming',
      eligibility: ['All farmers in Assam registered with local revenue circle'],
      howToApply: 'Apply through district agriculture office or CMSGUY portal',
      deadline: 'Subject to fund availability',
      website: 'https://diaboroagri.assam.gov.in',
      annualBenefit_INR: null,
    },
  ];
}

/**
 * Kerala-specific schemes
 * Source: https://keralaagriculture.gov.in (Official Kerala Agriculture Portal)
 */
function getKeralaSchemes(): GovernmentScheme[] {
  return [
    {
      name: 'Kerala State Crop Insurance Scheme',
      category: 'insurance',
      description: 'State-funded crop insurance covering seasonal and perennial crops at low premium',
      benefit: 'Coverage of crop loss at low premium (2% for food crops, 5% for commercial)',
      eligibility: ['All farmers in Kerala growing notified crops'],
      howToApply: 'Apply through Krishi Bhavan or agricultural officer',
      deadline: 'Before each crop season',
      website: 'https://keralaagriculture.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Subhiksha Keralam',
      category: 'subsidy',
      description: 'State scheme to increase food crop production through subsidized inputs',
      benefit: 'Free seeds, subsidized fertilizers, and support for paddy cultivation',
      eligibility: ['All farmers in Kerala cultivating food crops'],
      howToApply: 'Register at local Krishi Bhavan',
      deadline: 'Before each season',
      website: 'https://keralaagriculture.gov.in',
      annualBenefit_INR: null,
    },
  ];
}
