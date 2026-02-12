/**
 * Reference data for Indian crop economics
 * Sources: Government MSP notifications, ICAR cost studies, Agmarknet historical data
 *
 * Note: Prices are approximate and should be supplemented with live API data.
 * MSP = Minimum Support Price (Government guaranteed price)
 */

export interface CropEconomics {
  crop: string;
  varieties: string[];
  msp_per_quintal: number;             // INR per quintal (100kg)
  typical_market_price_range: [number, number]; // INR per quintal
  avg_yield_quintal_per_acre: number;
  cost_of_cultivation_per_acre: number; // INR
  season: 'kharif' | 'rabi' | 'zaid' | 'annual';
  growing_duration_days: number;
  best_selling_months: string[];
  seasonal_price_pattern: string;
  risk_factors: string[];
}

/**
 * Comprehensive crop economics database for major Indian crops
 * Prices approximate for 2024-2025 season
 */
export const CROP_ECONOMICS: CropEconomics[] = [
  {
    crop: 'Rice (Paddy)',
    varieties: ['Basmati', 'IR-64', 'Sona Masuri', 'Swarna', 'HMT'],
    msp_per_quintal: 2300,
    typical_market_price_range: [1800, 4500],
    avg_yield_quintal_per_acre: 20,
    cost_of_cultivation_per_acre: 25000,
    season: 'kharif',
    growing_duration_days: 120,
    best_selling_months: ['Nov', 'Dec', 'Jan'],
    seasonal_price_pattern: 'Prices lowest at harvest (Oct-Nov), rise steadily until next monsoon',
    risk_factors: ['Water intensive', 'Pest attacks (BPH, blast)', 'MSP procurement delays'],
  },
  {
    crop: 'Wheat',
    varieties: ['HD-2967', 'PBW-343', 'Sharbati', 'Lokwan', 'GW-322'],
    msp_per_quintal: 2275,
    typical_market_price_range: [2000, 3200],
    avg_yield_quintal_per_acre: 18,
    cost_of_cultivation_per_acre: 18000,
    season: 'rabi',
    growing_duration_days: 130,
    best_selling_months: ['Apr', 'May', 'Jun'],
    seasonal_price_pattern: 'Prices lowest at harvest (Apr), government procurement supports floor',
    risk_factors: ['Terminal heat stress', 'Rust disease', 'Unseasonal rain at harvest'],
  },
  {
    crop: 'Cotton',
    varieties: ['Bt Cotton (Bollgard II)', 'DCH-32', 'Suraj', 'NH-44'],
    msp_per_quintal: 7020,
    typical_market_price_range: [5500, 9000],
    avg_yield_quintal_per_acre: 8,
    cost_of_cultivation_per_acre: 30000,
    season: 'kharif',
    growing_duration_days: 180,
    best_selling_months: ['Dec', 'Jan', 'Feb'],
    seasonal_price_pattern: 'International prices drive domestic market. Best to sell in Jan-Feb',
    risk_factors: ['Pink bollworm', 'Whitefly', 'Price volatility', 'Long duration crop'],
  },
  {
    crop: 'Soybean',
    varieties: ['JS-335', 'JS-9560', 'MAUS-71', 'NRC-37'],
    msp_per_quintal: 4600,
    typical_market_price_range: [3800, 6000],
    avg_yield_quintal_per_acre: 8,
    cost_of_cultivation_per_acre: 16000,
    season: 'kharif',
    growing_duration_days: 100,
    best_selling_months: ['Nov', 'Dec', 'Jan'],
    seasonal_price_pattern: 'International soybean prices influence local market, MSP acts as floor',
    risk_factors: ['Girdle beetle', 'Yellow mosaic virus', 'Excess rain at harvest'],
  },
  {
    crop: 'Sugarcane',
    varieties: ['Co-86032', 'CoM-0265', 'Co-0238', 'CoLk-94184'],
    msp_per_quintal: 315,
    typical_market_price_range: [280, 400],
    avg_yield_quintal_per_acre: 350,
    cost_of_cultivation_per_acre: 45000,
    season: 'annual',
    growing_duration_days: 365,
    best_selling_months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    seasonal_price_pattern: 'Factory purchase price (FRP/SAP) set by government. Arrears common.',
    risk_factors: ['Payment delays from sugar mills', 'Water intensive', 'Red rot disease'],
  },
  {
    crop: 'Groundnut',
    varieties: ['TG-37A', 'TAG-24', 'GG-20', 'ICGS-76'],
    msp_per_quintal: 6377,
    typical_market_price_range: [5000, 8000],
    avg_yield_quintal_per_acre: 8,
    cost_of_cultivation_per_acre: 20000,
    season: 'kharif',
    growing_duration_days: 110,
    best_selling_months: ['Nov', 'Dec', 'Jan'],
    seasonal_price_pattern: 'Prices peak in summer months (Apr-May) when stocks deplete',
    risk_factors: ['Aflatoxin contamination', 'Tikka disease', 'Drought sensitivity'],
  },
  {
    crop: 'Chickpea (Gram)',
    varieties: ['JG-11', 'Vijay', 'JAKI-9218', 'KAK-2'],
    msp_per_quintal: 5440,
    typical_market_price_range: [4500, 7500],
    avg_yield_quintal_per_acre: 7,
    cost_of_cultivation_per_acre: 14000,
    season: 'rabi',
    growing_duration_days: 110,
    best_selling_months: ['Mar', 'Apr', 'May'],
    seasonal_price_pattern: 'Prices tend to rise post-harvest, best to store and sell in June-July',
    risk_factors: ['Pod borer', 'Wilt disease', 'Unseasonal rain'],
  },
  {
    crop: 'Turmeric',
    varieties: ['Salem', 'Erode Local', 'Alleppey', 'Rajapuri'],
    msp_per_quintal: 0,
    typical_market_price_range: [6000, 15000],
    avg_yield_quintal_per_acre: 25,
    cost_of_cultivation_per_acre: 50000,
    season: 'kharif',
    growing_duration_days: 240,
    best_selling_months: ['Mar', 'Apr', 'May'],
    seasonal_price_pattern: 'Highly cyclical - prices can vary 2-3x year to year based on supply',
    risk_factors: ['Long duration ties up land', 'Rhizome rot', 'Price volatility'],
  },
  {
    crop: 'Onion',
    varieties: ['Nashik Red', 'Bellary Red', 'Agrifound Dark Red', 'Pusa Ratnar'],
    msp_per_quintal: 0,
    typical_market_price_range: [800, 5000],
    avg_yield_quintal_per_acre: 100,
    cost_of_cultivation_per_acre: 35000,
    season: 'rabi',
    growing_duration_days: 120,
    best_selling_months: ['Aug', 'Sep', 'Oct'],
    seasonal_price_pattern: 'Extreme volatility. Store rabi onion for monsoon sale for best prices.',
    risk_factors: ['Storage losses (30-40%)', 'Price crashes', 'Export bans by government'],
  },
  {
    crop: 'Maize',
    varieties: ['HQPM-1', 'DHM-117', 'Vivek QPM-9', 'Prakash'],
    msp_per_quintal: 2090,
    typical_market_price_range: [1600, 2800],
    avg_yield_quintal_per_acre: 22,
    cost_of_cultivation_per_acre: 15000,
    season: 'kharif',
    growing_duration_days: 100,
    best_selling_months: ['Nov', 'Dec', 'Jan'],
    seasonal_price_pattern: 'Poultry industry demand drives prices. Peak demand in summer.',
    risk_factors: ['Fall armyworm', 'Stalk rot', 'Low MSP compared to other crops'],
  },
  {
    crop: 'Mustard',
    varieties: ['Pusa Bold', 'Varuna', 'RH-749', 'NRCHB-101'],
    msp_per_quintal: 5650,
    typical_market_price_range: [4500, 7000],
    avg_yield_quintal_per_acre: 6,
    cost_of_cultivation_per_acre: 12000,
    season: 'rabi',
    growing_duration_days: 120,
    best_selling_months: ['Mar', 'Apr', 'May'],
    seasonal_price_pattern: 'Government edible oil policy impacts prices. Usually good returns.',
    risk_factors: ['Aphid infestation', 'White rust', 'Frost damage'],
  },
  {
    crop: 'Tomato',
    varieties: ['Arka Rakshak', 'Pusa Ruby', 'TH-1', 'Hybrid varieties'],
    msp_per_quintal: 0,
    typical_market_price_range: [500, 6000],
    avg_yield_quintal_per_acre: 150,
    cost_of_cultivation_per_acre: 45000,
    season: 'rabi',
    growing_duration_days: 90,
    best_selling_months: ['Jun', 'Jul', 'Aug'],
    seasonal_price_pattern: 'Extreme price swings. Off-season production with protected cultivation gives best returns.',
    risk_factors: ['Highly perishable', 'Price crash during peak supply', 'Leaf curl virus'],
  },
];

/**
 * Major mandis (agricultural markets) by state
 */
export const MAJOR_MANDIS: Record<string, Array<{ name: string; district: string; lat: number; lng: number; majorCrops: string[] }>> = {
  'Maharashtra': [
    { name: 'Lasalgaon Mandi', district: 'Nashik', lat: 20.1432, lng: 74.2288, majorCrops: ['Onion', 'Tomato'] },
    { name: 'Nagpur Mandi', district: 'Nagpur', lat: 21.1458, lng: 79.0882, majorCrops: ['Cotton', 'Soybean', 'Oranges'] },
    { name: 'Pune Market Yard', district: 'Pune', lat: 18.5204, lng: 73.8567, majorCrops: ['Vegetables', 'Fruits', 'Grains'] },
    { name: 'Amravati Mandi', district: 'Amravati', lat: 20.9333, lng: 77.7833, majorCrops: ['Cotton', 'Soybean', 'Turmeric'] },
    { name: 'Akola Mandi', district: 'Akola', lat: 20.7000, lng: 77.0000, majorCrops: ['Cotton', 'Soybean', 'Gram'] },
    { name: 'Yavatmal Mandi', district: 'Yavatmal', lat: 20.3888, lng: 78.1204, majorCrops: ['Cotton', 'Soybean', 'Tur'] },
  ],
  'Madhya Pradesh': [
    { name: 'Indore Mandi', district: 'Indore', lat: 22.7196, lng: 75.8577, majorCrops: ['Soybean', 'Wheat', 'Gram'] },
    { name: 'Neemuch Mandi', district: 'Neemuch', lat: 24.4728, lng: 74.8719, majorCrops: ['Garlic', 'Coriander', 'Opium'] },
  ],
  'Rajasthan': [
    { name: 'Jaipur Mandi', district: 'Jaipur', lat: 26.9124, lng: 75.7873, majorCrops: ['Mustard', 'Bajra', 'Wheat'] },
    { name: 'Jodhpur Mandi', district: 'Jodhpur', lat: 26.2389, lng: 73.0243, majorCrops: ['Cumin', 'Bajra', 'Guar'] },
  ],
  'Uttar Pradesh': [
    { name: 'Lucknow Mandi', district: 'Lucknow', lat: 26.8467, lng: 80.9462, majorCrops: ['Wheat', 'Rice', 'Sugarcane'] },
    { name: 'Agra Mandi', district: 'Agra', lat: 27.1767, lng: 78.0081, majorCrops: ['Potato', 'Wheat', 'Mustard'] },
  ],
  'Punjab': [
    { name: 'Khanna Mandi', district: 'Ludhiana', lat: 30.6942, lng: 76.2243, majorCrops: ['Wheat', 'Rice'] },
    { name: 'Amritsar Mandi', district: 'Amritsar', lat: 31.6340, lng: 74.8723, majorCrops: ['Wheat', 'Rice', 'Potato'] },
  ],
  'Karnataka': [
    { name: 'Hubli-Dharwad Mandi', district: 'Dharwad', lat: 15.3647, lng: 75.1240, majorCrops: ['Cotton', 'Groundnut', 'Chilli'] },
    { name: 'Raichur Mandi', district: 'Raichur', lat: 16.2120, lng: 77.3439, majorCrops: ['Rice', 'Cotton', 'Tur'] },
  ],
  'Andhra Pradesh': [
    { name: 'Guntur Mandi', district: 'Guntur', lat: 16.3067, lng: 80.4365, majorCrops: ['Chilli', 'Tobacco', 'Cotton'] },
    { name: 'Kurnool Mandi', district: 'Kurnool', lat: 15.8281, lng: 78.0373, majorCrops: ['Groundnut', 'Jowar', 'Sunflower'] },
  ],
  'Tamil Nadu': [
    { name: 'Erode Mandi', district: 'Erode', lat: 11.3410, lng: 77.7172, majorCrops: ['Turmeric', 'Coconut', 'Cotton'] },
    { name: 'Salem Mandi', district: 'Salem', lat: 11.6643, lng: 78.1460, majorCrops: ['Turmeric', 'Tapioca', 'Mangoes'] },
  ],
  'Telangana': [
    { name: 'Warangal Mandi', district: 'Warangal', lat: 17.9784, lng: 79.5941, majorCrops: ['Rice', 'Cotton', 'Chilli'] },
    { name: 'Nizamabad Mandi', district: 'Nizamabad', lat: 18.6725, lng: 78.0940, majorCrops: ['Turmeric', 'Rice', 'Soybean'] },
  ],
  'Gujarat': [
    { name: 'Rajkot Mandi', district: 'Rajkot', lat: 22.3039, lng: 70.8022, majorCrops: ['Groundnut', 'Cotton', 'Castor'] },
    { name: 'Unjha Mandi', district: 'Mehsana', lat: 23.8005, lng: 72.3961, majorCrops: ['Cumin', 'Fennel', 'Isabgol'] },
  ],
};

/**
 * Reverse geocode to approximate state/district from coordinates
 * Uses a simple bounding box approach for Indian states
 */
export function approximateLocation(lat: number, lng: number): { state: string; district: string } {
  // Simplified India state mapping based on lat/lng regions
  const stateRegions: Array<{ state: string; latMin: number; latMax: number; lngMin: number; lngMax: number; defaultDistrict: string }> = [
    { state: 'Maharashtra', latMin: 15.6, latMax: 22.0, lngMin: 72.6, lngMax: 80.9, defaultDistrict: 'General' },
    { state: 'Madhya Pradesh', latMin: 21.0, latMax: 26.9, lngMin: 74.0, lngMax: 82.8, defaultDistrict: 'General' },
    { state: 'Rajasthan', latMin: 23.0, latMax: 30.2, lngMin: 69.5, lngMax: 78.3, defaultDistrict: 'General' },
    { state: 'Uttar Pradesh', latMin: 23.9, latMax: 30.4, lngMin: 77.1, lngMax: 84.6, defaultDistrict: 'General' },
    { state: 'Punjab', latMin: 29.5, latMax: 32.5, lngMin: 73.8, lngMax: 77.0, defaultDistrict: 'General' },
    { state: 'Karnataka', latMin: 11.6, latMax: 18.4, lngMin: 74.0, lngMax: 78.6, defaultDistrict: 'General' },
    { state: 'Andhra Pradesh', latMin: 12.4, latMax: 19.1, lngMin: 77.0, lngMax: 84.8, defaultDistrict: 'General' },
    { state: 'Tamil Nadu', latMin: 8.1, latMax: 13.6, lngMin: 76.2, lngMax: 80.3, defaultDistrict: 'General' },
    { state: 'Telangana', latMin: 15.8, latMax: 19.9, lngMin: 77.3, lngMax: 81.3, defaultDistrict: 'General' },
    { state: 'Gujarat', latMin: 20.1, latMax: 24.7, lngMin: 68.2, lngMax: 74.5, defaultDistrict: 'General' },
  ];

  for (const region of stateRegions) {
    if (lat >= region.latMin && lat <= region.latMax && lng >= region.lngMin && lng <= region.lngMax) {
      return { state: region.state, district: region.defaultDistrict };
    }
  }

  return { state: 'India', district: 'Unknown' };
}
