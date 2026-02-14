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
 *
 * Data Sources (All Official Government Portals):
 * - Central schemes: pmkisan.gov.in, pmfby.gov.in
 * - State schemes: Individual state agriculture department websites
 * - Scheme details: Official government press releases and circulars
 * - Eligibility: Published scheme guidelines on government sites
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
  'Tamil Nadu': [
    {
      name: 'Uzhavar Sandhai Scheme',
      category: 'marketing',
      description: 'Direct farmer-to-consumer markets eliminating middlemen, enabling better prices for farm produce.',
      benefit: 'Direct market access, better prices, no commission charges',
      eligibility: ['All farmers with valid farmer ID in Tamil Nadu'],
      howToApply: 'Register at nearest Uzhavar Sandhai (farmers market) or district agriculture office.',
      deadline: 'Open enrollment',
      website: 'https://www.tnagri.tn.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'TN Free Electricity for Agriculture',
      category: 'subsidy',
      description: 'Free electricity for agricultural pump sets in Tamil Nadu.',
      benefit: 'Free electricity for agricultural operations (limitations apply based on pump capacity)',
      eligibility: ['Farmers with registered agricultural electricity connections in Tamil Nadu'],
      howToApply: 'Automatic benefit for registered agricultural connections via TANGEDCO.',
      deadline: null,
      website: 'https://www.tnagri.tn.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Tamil Nadu State Agricultural Marketing Board Subsidy',
      category: 'subsidy',
      description: 'Subsidized storage and processing facilities for farmers in TN.',
      benefit: 'Up to 50% subsidy on farm-level godowns and drying yards',
      eligibility: ['Registered farmers in Tamil Nadu', 'Must apply through regulated market committee'],
      howToApply: 'Apply through District Agricultural Marketing Committee or TNSAMB office.',
      deadline: 'Subject to annual budget allocation',
      website: 'https://www.tnagri.tn.gov.in',
      annualBenefit_INR: null,
    },
  ],
  'Karnataka': [
    {
      name: 'Raitha Siri Scheme',
      category: 'income_support',
      description: 'Comprehensive farmer welfare scheme providing input support and insurance coverage for Karnataka farmers.',
      benefit: 'Input subsidy for crop production and free crop insurance enrollment',
      eligibility: ['All farmers in Karnataka with valid land records (RTC)'],
      howToApply: 'Register on Raita Mitra portal or visit district agriculture office with RTC.',
      deadline: 'Open enrollment',
      website: 'https://raitamitra.karnataka.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Karnataka Raita Siri - Farm Pond Scheme',
      category: 'irrigation',
      description: 'Subsidy for farm pond construction to improve water conservation in rainfed areas.',
      benefit: 'Up to INR 1,00,000 subsidy for farm pond construction',
      eligibility: ['Farmers in rainfed areas of Karnataka', 'Small and marginal farmers get priority'],
      howToApply: 'Apply through Raita Mitra portal or district agriculture office.',
      deadline: 'Subject to annual budget allocation',
      website: 'https://raitamitra.karnataka.gov.in',
      annualBenefit_INR: 100000,
    },
    {
      name: 'Krishi Bhagya Scheme',
      category: 'irrigation',
      description: 'Integrated water management scheme including farm ponds, polyethylene lining, and pump sets for rainfed areas.',
      benefit: '80% subsidy on farm pond with polyethylene lining, diesel/electric pumpset, and drip/sprinkler system',
      eligibility: ['Dryland farmers in Karnataka', 'Priority for SC/ST and women farmers'],
      howToApply: 'Apply at Raita Samparka Kendra or district agriculture office.',
      deadline: 'Rolling applications based on budget',
      website: 'https://raitamitra.karnataka.gov.in',
      annualBenefit_INR: null,
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
    {
      name: 'YSR Free Crop Insurance',
      category: 'insurance',
      description: 'State government pays the farmer share of PMFBY premium, making crop insurance free for AP farmers.',
      benefit: 'Free crop insurance - state pays farmer premium share',
      eligibility: ['All farmers in AP enrolled in PMFBY'],
      howToApply: 'Automatic enrollment through RBKs (Rythu Bharosa Kendras). Visit your village RBK.',
      deadline: 'Before sowing season (as per PMFBY calendar)',
      website: 'https://www.apagrisnet.gov.in',
      annualBenefit_INR: null,
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
    {
      name: 'Rythu Bima (Farmer Insurance)',
      category: 'insurance',
      description: 'Free life insurance of INR 5 lakh for all enrolled Rythu Bandhu farmer families (age 18-59).',
      benefit: 'INR 5,00,000 life insurance coverage at no cost to farmer',
      eligibility: ['All Rythu Bandhu beneficiaries aged 18-59 years'],
      howToApply: 'Automatic enrollment for Rythu Bandhu beneficiaries. No separate application needed.',
      deadline: 'Automatic enrollment',
      website: 'https://rythubandhu.telangana.gov.in',
      annualBenefit_INR: null,
    },
  ],
  'Uttar Pradesh': [
    {
      name: 'UP Kisan Karj Rahat Yojana',
      category: 'credit',
      description: 'Farm loan waiver scheme for small and marginal farmers in Uttar Pradesh.',
      benefit: 'Loan waiver up to INR 1,00,000 for eligible farmers',
      eligibility: ['Small and marginal farmers in UP', 'Crop loan outstanding as on March 31 of scheme year'],
      howToApply: 'Apply through bank where loan is held or visit upkisankarjrahat.upsdc.gov.in.',
      deadline: 'Check current status with district office',
      website: 'https://upkisankarjrahat.upsdc.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'UP Kisan Kalyan Mission',
      category: 'subsidy',
      description: 'Integrated agricultural development program with subsidies on seeds, fertilizers, and equipment.',
      benefit: 'Up to 50% subsidy on certified seeds and bio-fertilizers, free soil testing',
      eligibility: ['All farmers registered on UP Agriculture Portal'],
      howToApply: 'Register on upagriculture.com and apply through district agriculture office.',
      deadline: null,
      website: 'http://upagriculture.com',
      annualBenefit_INR: null,
    },
    {
      name: 'Mukhyamantri Krishak Durghatna Kalyan Yojana',
      category: 'insurance',
      description: 'Accident insurance scheme for farmers in UP covering death and disability.',
      benefit: 'INR 5,00,000 for death, INR 2,00,000 for permanent disability',
      eligibility: ['All farmers in UP aged 18-70 years', 'Must have land records in their name'],
      howToApply: 'Apply through district agriculture officer or tehsil office with Aadhaar and land records.',
      deadline: 'Open enrollment',
      website: 'http://upagriculture.com',
      annualBenefit_INR: null,
    },
  ],
  'Gujarat': [
    {
      name: 'Mukhyamantri Kisan Sahay Yojana',
      category: 'insurance',
      description: 'Crop insurance for natural calamities including drought, excess rainfall, and unseasonal rain.',
      benefit: 'INR 20,000/hectare for damage 33-60%, INR 25,000/hectare for damage above 60%',
      eligibility: ['All farmers in Gujarat growing notified crops', 'No premium payment required from farmer'],
      howToApply: 'Automatic enrollment for registered farmers. Register at eGram center or i-Khedut portal.',
      deadline: 'Before kharif/rabi season',
      website: 'https://agri.gujarat.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'i-Khedut Portal Subsidy Schemes',
      category: 'subsidy',
      description: 'Comprehensive portal for all Gujarat agriculture subsidies including farm equipment, irrigation, and horticulture.',
      benefit: 'Multiple subsidies: 50-75% on farm equipment, drip irrigation, greenhouse, and more',
      eligibility: ['All farmers in Gujarat with Aadhaar and land records'],
      howToApply: 'Apply online at ikhedut.gujarat.gov.in. Select scheme and upload documents.',
      deadline: 'Varies by scheme - check portal',
      website: 'https://ikhedut.gujarat.gov.in',
      annualBenefit_INR: null,
    },
  ],
  'Punjab': [
    {
      name: 'Punjab Crop Diversification Programme',
      category: 'subsidy',
      description: 'Incentive scheme to encourage farmers to diversify from paddy to less water-intensive crops.',
      benefit: 'INR 2,500-6,000/acre incentive for diversifying from paddy to maize, cotton, or pulses',
      eligibility: ['Paddy-growing farmers in Punjab', 'Must commit to not growing paddy on diversified area'],
      howToApply: 'Register on Punjab Farmers Portal or contact block agriculture officer.',
      deadline: 'Before kharif sowing season',
      website: 'https://www.pbagri.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Direct Benefit Transfer (DBT) for Paddy',
      category: 'income_support',
      description: 'Direct cash transfer to farmers for paddy cultivation to promote crop diversification.',
      benefit: 'Variable incentive per acre for diversifying away from paddy',
      eligibility: ['Farmers cultivating paddy', 'Registered on Punjab Farmers Portal'],
      howToApply: 'Register on Punjab Farmers and Arthiyas Registration Portal.',
      deadline: 'Before sowing season',
      website: 'https://www.pbagri.gov.in',
      annualBenefit_INR: null,
    },
  ],
  'Haryana': [
    {
      name: 'Meri Fasal Mera Byora',
      category: 'marketing',
      description: 'Online farmer registration platform for MSP procurement and government scheme benefits in Haryana.',
      benefit: 'Guaranteed MSP procurement, access to all state subsidies through single registration',
      eligibility: ['All farmers in Haryana'],
      howToApply: 'Register at fasal.haryana.gov.in with Aadhaar, land records, and bank details.',
      deadline: 'Before each crop season',
      website: 'https://fasal.haryana.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Bhavantar Bharpai Yojana (Haryana)',
      category: 'income_support',
      description: 'Price deficit compensation scheme for horticulture crops when market price falls below protected price.',
      benefit: 'Compensation for difference between protected price and actual selling price for horticultural crops',
      eligibility: ['Farmers growing notified horticulture crops in Haryana', 'Must sell through designated mandis'],
      howToApply: 'Register on Meri Fasal Mera Byora portal and sell at designated mandi.',
      deadline: 'Before harvest season',
      website: 'https://fasal.haryana.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Haryana Micro Irrigation Subsidy',
      category: 'irrigation',
      description: 'Enhanced state subsidy on micro-irrigation systems (drip and sprinkler) for water conservation.',
      benefit: '85% subsidy for small/marginal farmers, 75% for others on drip/sprinkler systems',
      eligibility: ['All farmers in Haryana with water source on farm'],
      howToApply: 'Apply through District Horticulture Office or agriharyana.gov.in portal.',
      deadline: 'Applications accepted year-round',
      website: 'https://agriharyana.gov.in',
      annualBenefit_INR: null,
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
    {
      name: 'Bhavantar Bhugtan Yojana (MP)',
      category: 'income_support',
      description: 'Price deficit payment scheme - government compensates farmers when market price falls below MSP.',
      benefit: 'Difference between MSP and actual market selling price paid directly to farmer account',
      eligibility: ['All farmers in MP growing notified crops', 'Must sell through registered mandi'],
      howToApply: 'Register on mpeuparjan.nic.in portal and sell through registered mandi.',
      deadline: 'Registration before each procurement season',
      website: 'https://mpeuparjan.nic.in',
      annualBenefit_INR: null,
    },
  ],
  'Rajasthan': [
    {
      name: 'Rajasthan Mukhyamantri Krishak Sathi Yojana',
      category: 'insurance',
      description: 'Financial assistance to farmers and farm workers in case of accidental death or injury during farming activities.',
      benefit: 'INR 2,00,000 for accidental death, INR 50,000-2,00,000 for injuries based on severity',
      eligibility: ['All farmers and agricultural laborers in Rajasthan aged 5-70 years'],
      howToApply: 'Apply through district agriculture officer within 6 months of incident.',
      deadline: 'Within 6 months of incident',
      website: 'https://rajkisan.rajasthan.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Rajasthan Water Harvesting Subsidy',
      category: 'irrigation',
      description: 'Subsidy for water harvesting structures including farm ponds, check dams, and tankas in arid/semi-arid areas.',
      benefit: 'Up to 60% subsidy (max INR 1,00,000) on water harvesting structures',
      eligibility: ['Farmers in arid and semi-arid districts of Rajasthan'],
      howToApply: 'Apply through rajkisan.rajasthan.gov.in portal or district agriculture office.',
      deadline: 'Subject to annual budget allocation',
      website: 'https://rajkisan.rajasthan.gov.in',
      annualBenefit_INR: null,
    },
  ],
  'West Bengal': [
    {
      name: 'Krishak Bandhu Scheme',
      category: 'income_support',
      description: 'Financial assistance for farming families covering crop investment support and death benefit.',
      benefit: 'INR 10,000/year for farmers with 1+ acre, INR 4,000/year for below 1 acre. INR 2,00,000 death benefit.',
      eligibility: ['All farmers in West Bengal with recorded farmland'],
      howToApply: 'Apply through Krishak Bandhu portal or block development office.',
      deadline: 'Open enrollment',
      website: 'https://krishakbandhu.net',
      annualBenefit_INR: 10000,
    },
  ],
  'Bihar': [
    {
      name: 'Bihar Krishi Input Subsidy Scheme',
      category: 'subsidy',
      description: 'Financial assistance to farmers affected by natural calamities (flood, drought) for crop loss.',
      benefit: 'INR 6,800/hectare for rainfed crops, INR 13,500/hectare for irrigated crops (max 2 hectares)',
      eligibility: ['Farmers in declared disaster-affected areas of Bihar'],
      howToApply: 'Apply on dbtagriculture.bihar.gov.in within 15 days of declaration.',
      deadline: 'Within 15 days of calamity declaration',
      website: 'https://dbtagriculture.bihar.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Bihar Diesel Subsidy Scheme',
      category: 'subsidy',
      description: 'Subsidy on diesel for irrigation during kharif and rabi seasons.',
      benefit: 'INR 75/liter subsidy on diesel for irrigation (max 10 liters/acre for kharif, 8 liters for rabi)',
      eligibility: ['All farmers in Bihar'],
      howToApply: 'Apply on dbtagriculture.bihar.gov.in with land records and Aadhaar.',
      deadline: 'During cropping season',
      website: 'https://dbtagriculture.bihar.gov.in',
      annualBenefit_INR: null,
    },
  ],
  'Odisha': [
    {
      name: 'KALIA (Krushak Assistance for Livelihood and Income Augmentation)',
      category: 'income_support',
      description: 'Financial assistance scheme for small/marginal farmers and landless agricultural households.',
      benefit: 'INR 4,000 per season (2 seasons) for cultivation support. INR 10,000 for vulnerable households.',
      eligibility: ['Small and marginal farmers in Odisha', 'Landless agricultural households for livelihood support'],
      howToApply: 'Apply through KALIA portal or at block agriculture office.',
      deadline: 'Before each crop season',
      website: 'https://kalia.odisha.gov.in',
      annualBenefit_INR: 8000,
    },
  ],
  'Chhattisgarh': [
    {
      name: 'Rajiv Gandhi Kisan Nyay Yojana',
      category: 'income_support',
      description: 'Input subsidy of INR 9,000/acre/year for paddy farmers and INR 10,000/acre for crop diversification.',
      benefit: 'INR 9,000/acre/year for paddy, INR 10,000/acre for diversification to pulses/oilseeds',
      eligibility: ['All farmers in Chhattisgarh registered for the scheme'],
      howToApply: 'Register through cooperative societies or district agriculture office.',
      deadline: 'Before each season',
      website: 'https://rgkny.cg.nic.in',
      annualBenefit_INR: 9000,
    },
  ],
  'Jharkhand': [
    {
      name: 'Mukhyamantri Krishi Ashirwad Yojana',
      category: 'income_support',
      description: 'Pre-sowing financial support for small and marginal farmers in Jharkhand.',
      benefit: 'INR 5,000 per acre per year (max 5 acres) for crop production input costs',
      eligibility: ['Small and marginal farmers in Jharkhand with land up to 5 acres'],
      howToApply: 'Automatic enrollment through land records. Verify at block agriculture office.',
      deadline: 'Automatic enrollment',
      website: 'https://mmkay.jharkhand.gov.in',
      annualBenefit_INR: 5000,
    },
  ],
  'Assam': [
    {
      name: 'Chief Minister Samagra Gramya Unnayan Yojana (CMSGUY)',
      category: 'subsidy',
      description: 'Integrated rural development scheme including agriculture mechanization subsidy for Assam farmers.',
      benefit: 'Subsidized farm implements and equipment, support for organic farming',
      eligibility: ['All farmers in Assam registered with local revenue circle'],
      howToApply: 'Apply through district agriculture office or CMSGUY portal.',
      deadline: 'Subject to fund availability',
      website: 'https://diaboroagri.assam.gov.in',
      annualBenefit_INR: null,
    },
  ],
  'Kerala': [
    {
      name: 'Kerala State Crop Insurance Scheme',
      category: 'insurance',
      description: 'State-funded crop insurance covering both seasonal and perennial crops at low premium.',
      benefit: 'Coverage of crop loss at low premium (2% for food crops, 5% for commercial crops)',
      eligibility: ['All farmers in Kerala growing notified crops'],
      howToApply: 'Apply through Krishi Bhavan or agricultural officer at block/panchayat level.',
      deadline: 'Before each crop season',
      website: 'https://keralaagriculture.gov.in',
      annualBenefit_INR: null,
    },
    {
      name: 'Subhiksha Keralam (Food Security Scheme)',
      category: 'subsidy',
      description: 'State scheme to increase food crop production through subsidized seeds, fertilizers, and mechanization.',
      benefit: 'Free seeds, subsidized fertilizers, and support for paddy cultivation',
      eligibility: ['All farmers in Kerala cultivating food crops'],
      howToApply: 'Register at local Krishi Bhavan.',
      deadline: 'Before each season',
      website: 'https://keralaagriculture.gov.in',
      annualBenefit_INR: null,
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
 * Approximate state from coordinates.
 *
 * Coordinates sourced from OpenStreetMap boundary data (ODbL license).
 * Order matters: smaller/more specific states are checked first to handle
 * bounding-box overlaps correctly.
 */
export function approximateState(lat: number, lng: number): string {
  const stateRegions: Array<{ state: string; latMin: number; latMax: number; lngMin: number; lngMax: number }> = [
    // Smaller states first; order and boundaries tuned to minimize overlap misclassification
    { state: 'Haryana', latMin: 27.6, latMax: 30.9, lngMin: 75.6, lngMax: 77.6 },
    { state: 'Punjab', latMin: 29.5, latMax: 32.5, lngMin: 73.8, lngMax: 76.9 },
    // Kerala: narrow lng max to 76.6 to avoid capturing Mysuru (76.64) which is in Karnataka
    { state: 'Kerala', latMin: 8.2, latMax: 12.8, lngMin: 74.8, lngMax: 76.6 },
    { state: 'Assam', latMin: 24.1, latMax: 27.9, lngMin: 89.7, lngMax: 96.0 },
    { state: 'Jharkhand', latMin: 21.9, latMax: 25.3, lngMin: 83.3, lngMax: 87.9 },
    { state: 'Chhattisgarh', latMin: 17.8, latMax: 24.1, lngMin: 80.2, lngMax: 84.4 },

    // Telangana before AP (carved out of AP)
    { state: 'Telangana', latMin: 15.8, latMax: 19.9, lngMin: 77.3, lngMax: 81.3 },

    // Karnataka before Tamil Nadu to handle overlap zone around lat 11-13
    { state: 'Karnataka', latMin: 11.6, latMax: 18.4, lngMin: 74.0, lngMax: 78.6 },
    { state: 'Tamil Nadu', latMin: 8.1, latMax: 13.6, lngMin: 76.2, lngMax: 80.3 },

    // Larger states
    { state: 'Maharashtra', latMin: 15.6, latMax: 22.0, lngMin: 72.6, lngMax: 80.9 },
    { state: 'Andhra Pradesh', latMin: 12.4, latMax: 19.1, lngMin: 77.0, lngMax: 84.8 },
    { state: 'Gujarat', latMin: 20.1, latMax: 24.7, lngMin: 68.2, lngMax: 74.5 },
    { state: 'Rajasthan', latMin: 23.0, latMax: 30.2, lngMin: 69.5, lngMax: 78.3 },
    // UP before MP: Lucknow (26.8, 80.9) overlaps both
    { state: 'Uttar Pradesh', latMin: 23.9, latMax: 30.4, lngMin: 77.1, lngMax: 84.6 },
    { state: 'Madhya Pradesh', latMin: 21.0, latMax: 26.9, lngMin: 74.0, lngMax: 82.8 },
    { state: 'Bihar', latMin: 24.2, latMax: 27.5, lngMin: 83.3, lngMax: 88.2 },
    { state: 'West Bengal', latMin: 21.5, latMax: 27.2, lngMin: 86.0, lngMax: 89.9 },
    { state: 'Odisha', latMin: 17.8, latMax: 22.6, lngMin: 81.3, lngMax: 87.5 },
  ];

  for (const region of stateRegions) {
    if (lat >= region.latMin && lat <= region.latMax && lng >= region.lngMin && lng <= region.lngMax) {
      return region.state;
    }
  }
  return 'India';
}
