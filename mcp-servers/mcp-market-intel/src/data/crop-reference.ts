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
 *
 * Data Sources (All Open):
 * - Coordinates: OpenStreetMap (ODbL license)
 * - Mandi locations: data.gov.in/catalog/apmc-market-mandi-rates (Open Government Data)
 * - Price reference: Agmarknet historical averages (government open data)
 * - Crop info: ICAR open publications
 */
export const MAJOR_MANDIS: Record<string, Array<{ name: string; district: string; lat: number; lng: number; majorCrops: string[] }>> = {
  'Maharashtra': [
    { name: 'Lasalgaon Mandi', district: 'Nashik', lat: 20.1432, lng: 74.2288, majorCrops: ['Onion', 'Tomato'] },
    { name: 'Nagpur Mandi', district: 'Nagpur', lat: 21.1458, lng: 79.0882, majorCrops: ['Cotton', 'Soybean', 'Oranges'] },
    { name: 'Pune Market Yard', district: 'Pune', lat: 18.5204, lng: 73.8567, majorCrops: ['Vegetables', 'Fruits', 'Grains'] },
    { name: 'Amravati Mandi', district: 'Amravati', lat: 20.9333, lng: 77.7833, majorCrops: ['Cotton', 'Soybean', 'Turmeric'] },
    { name: 'Akola Mandi', district: 'Akola', lat: 20.7000, lng: 77.0000, majorCrops: ['Cotton', 'Soybean', 'Gram'] },
    { name: 'Yavatmal Mandi', district: 'Yavatmal', lat: 20.3888, lng: 78.1204, majorCrops: ['Cotton', 'Soybean', 'Tur'] },
    { name: 'Aurangabad Mandi', district: 'Aurangabad', lat: 19.8762, lng: 75.3433, majorCrops: ['Jowar', 'Cotton', 'Bajra'] },
    { name: 'Solapur Mandi', district: 'Solapur', lat: 17.6599, lng: 75.9064, majorCrops: ['Onion', 'Gram', 'Tur'] },
    { name: 'Kolhapur Mandi', district: 'Kolhapur', lat: 16.7050, lng: 74.2433, majorCrops: ['Sugarcane', 'Turmeric', 'Rice'] },
  ],
  'Tamil Nadu': [
    { name: 'Erode Mandi', district: 'Erode', lat: 11.3410, lng: 77.7172, majorCrops: ['Turmeric', 'Coconut', 'Cotton'] },
    { name: 'Salem Mandi', district: 'Salem', lat: 11.6643, lng: 78.1460, majorCrops: ['Turmeric', 'Tapioca', 'Mangoes'] },
    { name: 'Vellore Mandi', district: 'Vellore', lat: 12.9165, lng: 79.1325, majorCrops: ['Rice', 'Groundnut', 'Sugarcane'] },
    { name: 'Dindigul Mandi', district: 'Dindigul', lat: 10.3624, lng: 77.9695, majorCrops: ['Rice', 'Maize', 'Cotton'] },
    { name: 'Coimbatore Mandi', district: 'Coimbatore', lat: 11.0168, lng: 76.9558, majorCrops: ['Coconut', 'Cotton', 'Vegetables'] },
    { name: 'Madurai Mandi', district: 'Madurai', lat: 9.9252, lng: 78.1198, majorCrops: ['Rice', 'Cotton', 'Vegetables'] },
    { name: 'Thanjavur Mandi', district: 'Thanjavur', lat: 10.7870, lng: 79.1378, majorCrops: ['Rice', 'Sugarcane', 'Groundnut'] },
    { name: 'Tirunelveli Mandi', district: 'Tirunelveli', lat: 8.7139, lng: 77.7567, majorCrops: ['Rice', 'Banana', 'Coconut'] },
  ],
  'Karnataka': [
    { name: 'Hubli-Dharwad Mandi', district: 'Dharwad', lat: 15.3647, lng: 75.1240, majorCrops: ['Cotton', 'Groundnut', 'Chilli'] },
    { name: 'Raichur Mandi', district: 'Raichur', lat: 16.2120, lng: 77.3439, majorCrops: ['Rice', 'Cotton', 'Tur'] },
    { name: 'Kolar Mandi', district: 'Kolar', lat: 13.1360, lng: 78.1292, majorCrops: ['Ragi', 'Tomato', 'Groundnut'] },
    { name: 'Belagavi Mandi', district: 'Belagavi', lat: 15.8497, lng: 74.4977, majorCrops: ['Sugarcane', 'Soybean', 'Groundnut'] },
    { name: 'Mysuru Mandi', district: 'Mysuru', lat: 12.2958, lng: 76.6394, majorCrops: ['Rice', 'Ragi', 'Sugarcane'] },
    { name: 'Davangere Mandi', district: 'Davangere', lat: 14.4644, lng: 75.9218, majorCrops: ['Maize', 'Cotton', 'Sunflower'] },
    { name: 'Ballari Mandi', district: 'Ballari', lat: 15.1394, lng: 76.9214, majorCrops: ['Rice', 'Cotton', 'Chilli'] },
    { name: 'Bidar Mandi', district: 'Bidar', lat: 17.9104, lng: 77.5199, majorCrops: ['Tur', 'Soybean', 'Gram'] },
  ],
  'Andhra Pradesh': [
    { name: 'Guntur Mandi', district: 'Guntur', lat: 16.3067, lng: 80.4365, majorCrops: ['Chilli', 'Tobacco', 'Cotton'] },
    { name: 'Kurnool Mandi', district: 'Kurnool', lat: 15.8281, lng: 78.0373, majorCrops: ['Groundnut', 'Jowar', 'Sunflower'] },
    { name: 'Adoni Mandi', district: 'Kurnool', lat: 15.6322, lng: 77.2773, majorCrops: ['Cotton', 'Groundnut', 'Jowar'] },
    { name: 'Vijayawada Mandi', district: 'Krishna', lat: 16.5062, lng: 80.6480, majorCrops: ['Rice', 'Chilli', 'Cotton'] },
    { name: 'Rajahmundry Mandi', district: 'East Godavari', lat: 17.0005, lng: 81.8040, majorCrops: ['Rice', 'Sugarcane', 'Coconut'] },
    { name: 'Ongole Mandi', district: 'Prakasam', lat: 15.5057, lng: 80.0499, majorCrops: ['Chilli', 'Tobacco', 'Groundnut'] },
    { name: 'Anantapur Mandi', district: 'Anantapur', lat: 14.6819, lng: 77.6006, majorCrops: ['Groundnut', 'Rice', 'Cotton'] },
  ],
  'Telangana': [
    { name: 'Warangal Mandi', district: 'Warangal', lat: 17.9784, lng: 79.5941, majorCrops: ['Rice', 'Cotton', 'Chilli'] },
    { name: 'Nizamabad Mandi', district: 'Nizamabad', lat: 18.6725, lng: 78.0940, majorCrops: ['Turmeric', 'Rice', 'Soybean'] },
    { name: 'Karimnagar Mandi', district: 'Karimnagar', lat: 18.4386, lng: 79.1288, majorCrops: ['Rice', 'Cotton', 'Maize'] },
    { name: 'Khammam Mandi', district: 'Khammam', lat: 17.2473, lng: 80.1514, majorCrops: ['Rice', 'Cotton', 'Chilli'] },
    { name: 'Nalgonda Mandi', district: 'Nalgonda', lat: 17.0575, lng: 79.2671, majorCrops: ['Rice', 'Cotton', 'Turmeric'] },
    { name: 'Adilabad Mandi', district: 'Adilabad', lat: 19.6641, lng: 78.5320, majorCrops: ['Cotton', 'Soybean', 'Tur'] },
  ],
  'Uttar Pradesh': [
    { name: 'Lucknow Mandi', district: 'Lucknow', lat: 26.8467, lng: 80.9462, majorCrops: ['Wheat', 'Rice', 'Sugarcane'] },
    { name: 'Agra Mandi', district: 'Agra', lat: 27.1767, lng: 78.0081, majorCrops: ['Potato', 'Wheat', 'Mustard'] },
    { name: 'Azadpur Mandi', district: 'Delhi NCR', lat: 28.6917, lng: 77.1789, majorCrops: ['Vegetables', 'Fruits', 'Onion'] },
    { name: 'Meerut Mandi', district: 'Meerut', lat: 28.9845, lng: 77.7064, majorCrops: ['Sugarcane', 'Wheat', 'Rice'] },
    { name: 'Varanasi Mandi', district: 'Varanasi', lat: 25.3176, lng: 82.9739, majorCrops: ['Rice', 'Wheat', 'Vegetables'] },
    { name: 'Kanpur Mandi', district: 'Kanpur', lat: 26.4499, lng: 80.3319, majorCrops: ['Wheat', 'Rice', 'Potato'] },
    { name: 'Allahabad Mandi', district: 'Prayagraj', lat: 25.4358, lng: 81.8463, majorCrops: ['Rice', 'Wheat', 'Gram'] },
    { name: 'Bareilly Mandi', district: 'Bareilly', lat: 28.3670, lng: 79.4304, majorCrops: ['Wheat', 'Sugarcane', 'Mustard'] },
    { name: 'Gorakhpur Mandi', district: 'Gorakhpur', lat: 26.7606, lng: 83.3732, majorCrops: ['Rice', 'Wheat', 'Sugarcane'] },
  ],
  'Gujarat': [
    { name: 'Rajkot Mandi', district: 'Rajkot', lat: 22.3039, lng: 70.8022, majorCrops: ['Groundnut', 'Cotton', 'Castor'] },
    { name: 'Unjha Mandi', district: 'Mehsana', lat: 23.8005, lng: 72.3961, majorCrops: ['Cumin', 'Fennel', 'Isabgol'] },
    { name: 'Ahmedabad Mandi', district: 'Ahmedabad', lat: 23.0225, lng: 72.5714, majorCrops: ['Wheat', 'Cotton', 'Castor'] },
    { name: 'Surat Mandi', district: 'Surat', lat: 21.1702, lng: 72.8311, majorCrops: ['Sugarcane', 'Cotton', 'Rice'] },
    { name: 'Junagadh Mandi', district: 'Junagadh', lat: 21.5222, lng: 70.4579, majorCrops: ['Groundnut', 'Sugarcane', 'Wheat'] },
    { name: 'Bhavnagar Mandi', district: 'Bhavnagar', lat: 21.7645, lng: 72.1519, majorCrops: ['Cotton', 'Groundnut', 'Wheat'] },
    { name: 'Amreli Mandi', district: 'Amreli', lat: 21.6032, lng: 71.2216, majorCrops: ['Groundnut', 'Cotton', 'Sesame'] },
  ],
  'Rajasthan': [
    { name: 'Jaipur Mandi', district: 'Jaipur', lat: 26.9124, lng: 75.7873, majorCrops: ['Mustard', 'Bajra', 'Wheat'] },
    { name: 'Jodhpur Mandi', district: 'Jodhpur', lat: 26.2389, lng: 73.0243, majorCrops: ['Cumin', 'Bajra', 'Guar'] },
    { name: 'Kota Mandi', district: 'Kota', lat: 25.2138, lng: 75.8648, majorCrops: ['Soybean', 'Wheat', 'Coriander'] },
    { name: 'Alwar Mandi', district: 'Alwar', lat: 27.5530, lng: 76.6346, majorCrops: ['Mustard', 'Wheat', 'Bajra'] },
    { name: 'Bikaner Mandi', district: 'Bikaner', lat: 28.0229, lng: 73.3119, majorCrops: ['Guar', 'Bajra', 'Moth Bean'] },
    { name: 'Udaipur Mandi', district: 'Udaipur', lat: 24.5854, lng: 73.7125, majorCrops: ['Maize', 'Wheat', 'Gram'] },
    { name: 'Sri Ganganagar Mandi', district: 'Sri Ganganagar', lat: 29.9094, lng: 73.8768, majorCrops: ['Wheat', 'Mustard', 'Cotton'] },
  ],
  'Punjab': [
    { name: 'Khanna Mandi', district: 'Ludhiana', lat: 30.6942, lng: 76.2243, majorCrops: ['Wheat', 'Rice'] },
    { name: 'Amritsar Mandi', district: 'Amritsar', lat: 31.6340, lng: 74.8723, majorCrops: ['Wheat', 'Rice', 'Potato'] },
    { name: 'Ludhiana Mandi', district: 'Ludhiana', lat: 30.9010, lng: 75.8573, majorCrops: ['Wheat', 'Rice', 'Maize'] },
    { name: 'Patiala Mandi', district: 'Patiala', lat: 30.3398, lng: 76.3869, majorCrops: ['Wheat', 'Rice', 'Mustard'] },
    { name: 'Jalandhar Mandi', district: 'Jalandhar', lat: 31.3260, lng: 75.5762, majorCrops: ['Wheat', 'Rice', 'Vegetables'] },
    { name: 'Bathinda Mandi', district: 'Bathinda', lat: 30.2110, lng: 74.9455, majorCrops: ['Wheat', 'Cotton', 'Rice'] },
    { name: 'Moga Mandi', district: 'Moga', lat: 30.8000, lng: 75.1700, majorCrops: ['Wheat', 'Rice', 'Maize'] },
  ],
  'Haryana': [
    { name: 'Karnal Mandi', district: 'Karnal', lat: 29.6857, lng: 76.9905, majorCrops: ['Wheat', 'Rice', 'Mustard'] },
    { name: 'Hisar Mandi', district: 'Hisar', lat: 29.1492, lng: 75.7217, majorCrops: ['Wheat', 'Cotton', 'Mustard'] },
    { name: 'Sirsa Mandi', district: 'Sirsa', lat: 29.5342, lng: 75.0267, majorCrops: ['Cotton', 'Wheat', 'Mustard'] },
    { name: 'Ambala Mandi', district: 'Ambala', lat: 30.3782, lng: 76.7767, majorCrops: ['Wheat', 'Rice', 'Vegetables'] },
    { name: 'Rohtak Mandi', district: 'Rohtak', lat: 28.8955, lng: 76.6066, majorCrops: ['Wheat', 'Mustard', 'Bajra'] },
    { name: 'Jind Mandi', district: 'Jind', lat: 29.3159, lng: 76.3143, majorCrops: ['Wheat', 'Rice', 'Cotton'] },
    { name: 'Kurukshetra Mandi', district: 'Kurukshetra', lat: 29.9695, lng: 76.8783, majorCrops: ['Wheat', 'Rice', 'Sugarcane'] },
  ],
  'Madhya Pradesh': [
    { name: 'Indore Mandi', district: 'Indore', lat: 22.7196, lng: 75.8577, majorCrops: ['Soybean', 'Wheat', 'Gram'] },
    { name: 'Neemuch Mandi', district: 'Neemuch', lat: 24.4728, lng: 74.8719, majorCrops: ['Garlic', 'Coriander', 'Soybean'] },
    { name: 'Bhopal Mandi', district: 'Bhopal', lat: 23.2599, lng: 77.4126, majorCrops: ['Wheat', 'Soybean', 'Gram'] },
    { name: 'Jabalpur Mandi', district: 'Jabalpur', lat: 23.1815, lng: 79.9864, majorCrops: ['Wheat', 'Rice', 'Gram'] },
    { name: 'Ujjain Mandi', district: 'Ujjain', lat: 23.1765, lng: 75.7885, majorCrops: ['Soybean', 'Wheat', 'Gram'] },
    { name: 'Gwalior Mandi', district: 'Gwalior', lat: 26.2183, lng: 78.1828, majorCrops: ['Mustard', 'Wheat', 'Gram'] },
    { name: 'Ratlam Mandi', district: 'Ratlam', lat: 23.3305, lng: 75.0367, majorCrops: ['Soybean', 'Garlic', 'Onion'] },
    { name: 'Harda Mandi', district: 'Harda', lat: 22.3422, lng: 77.0952, majorCrops: ['Soybean', 'Wheat', 'Cotton'] },
  ],
  'West Bengal': [
    { name: 'Siliguri Mandi', district: 'Darjeeling', lat: 26.7271, lng: 88.3953, majorCrops: ['Rice', 'Tea', 'Jute'] },
    { name: 'Burdwan Mandi', district: 'Purba Bardhaman', lat: 23.2324, lng: 87.8615, majorCrops: ['Rice', 'Potato', 'Jute'] },
    { name: 'Howrah Mandi', district: 'Howrah', lat: 22.5958, lng: 88.2636, majorCrops: ['Vegetables', 'Rice', 'Potato'] },
    { name: 'Midnapore Mandi', district: 'Paschim Medinipur', lat: 22.4250, lng: 87.3200, majorCrops: ['Rice', 'Sesame', 'Mustard'] },
    { name: 'Murshidabad Mandi', district: 'Murshidabad', lat: 24.1745, lng: 88.2700, majorCrops: ['Rice', 'Jute', 'Mango'] },
  ],
  'Bihar': [
    { name: 'Patna Mandi', district: 'Patna', lat: 25.6093, lng: 85.1376, majorCrops: ['Rice', 'Wheat', 'Maize'] },
    { name: 'Muzaffarpur Mandi', district: 'Muzaffarpur', lat: 26.1197, lng: 85.3910, majorCrops: ['Litchi', 'Rice', 'Wheat'] },
    { name: 'Gaya Mandi', district: 'Gaya', lat: 24.7914, lng: 84.9994, majorCrops: ['Rice', 'Wheat', 'Gram'] },
    { name: 'Bhagalpur Mandi', district: 'Bhagalpur', lat: 25.2425, lng: 86.9842, majorCrops: ['Rice', 'Wheat', 'Maize'] },
    { name: 'Darbhanga Mandi', district: 'Darbhanga', lat: 26.1542, lng: 85.8918, majorCrops: ['Rice', 'Wheat', 'Makhana'] },
  ],
  'Odisha': [
    { name: 'Cuttack Mandi', district: 'Cuttack', lat: 20.4625, lng: 85.8830, majorCrops: ['Rice', 'Vegetables', 'Jute'] },
    { name: 'Sambalpur Mandi', district: 'Sambalpur', lat: 21.4669, lng: 83.9812, majorCrops: ['Rice', 'Cotton', 'Groundnut'] },
    { name: 'Berhampur Mandi', district: 'Ganjam', lat: 19.3150, lng: 84.7941, majorCrops: ['Rice', 'Sugarcane', 'Cashew'] },
    { name: 'Balasore Mandi', district: 'Balasore', lat: 21.4934, lng: 86.9337, majorCrops: ['Rice', 'Vegetables', 'Cashew'] },
  ],
  'Chhattisgarh': [
    { name: 'Raipur Mandi', district: 'Raipur', lat: 21.2514, lng: 81.6296, majorCrops: ['Rice', 'Maize', 'Gram'] },
    { name: 'Durg Mandi', district: 'Durg', lat: 21.1904, lng: 81.2849, majorCrops: ['Rice', 'Wheat', 'Soybean'] },
    { name: 'Bilaspur Mandi', district: 'Bilaspur', lat: 22.0796, lng: 82.1391, majorCrops: ['Rice', 'Wheat', 'Gram'] },
  ],
  'Jharkhand': [
    { name: 'Ranchi Mandi', district: 'Ranchi', lat: 23.3441, lng: 85.3096, majorCrops: ['Rice', 'Vegetables', 'Maize'] },
    { name: 'Dumka Mandi', district: 'Dumka', lat: 24.2631, lng: 87.2494, majorCrops: ['Rice', 'Wheat', 'Maize'] },
    { name: 'Hazaribagh Mandi', district: 'Hazaribagh', lat: 23.9934, lng: 85.3637, majorCrops: ['Rice', 'Vegetables', 'Wheat'] },
  ],
  'Assam': [
    { name: 'Guwahati Mandi', district: 'Kamrup Metropolitan', lat: 26.1445, lng: 91.7362, majorCrops: ['Rice', 'Tea', 'Jute'] },
    { name: 'Jorhat Mandi', district: 'Jorhat', lat: 26.7509, lng: 94.2037, majorCrops: ['Rice', 'Tea', 'Mustard'] },
    { name: 'Nagaon Mandi', district: 'Nagaon', lat: 26.3464, lng: 92.6840, majorCrops: ['Rice', 'Jute', 'Sugarcane'] },
  ],
  'Kerala': [
    { name: 'Ernakulam Mandi', district: 'Ernakulam', lat: 9.9816, lng: 76.2999, majorCrops: ['Coconut', 'Rubber', 'Rice'] },
    { name: 'Thrissur Mandi', district: 'Thrissur', lat: 10.5276, lng: 76.2144, majorCrops: ['Coconut', 'Rice', 'Banana'] },
    { name: 'Wayanad Mandi', district: 'Wayanad', lat: 11.6854, lng: 76.1320, majorCrops: ['Coffee', 'Pepper', 'Rice'] },
    { name: 'Palakkad Mandi', district: 'Palakkad', lat: 10.7867, lng: 76.6548, majorCrops: ['Rice', 'Coconut', 'Vegetables'] },
  ],
};

/**
 * Reverse geocode to approximate state/district from coordinates
 * Uses a simple bounding box approach for Indian states.
 *
 * Note: Bounding boxes overlap for some states. The order matters -- more
 * specific/smaller states are checked first to avoid misclassification.
 * Coordinates sourced from OpenStreetMap boundary data (ODbL license).
 */
export function approximateLocation(lat: number, lng: number): { state: string; district: string } {
  // Simplified India state mapping based on lat/lng regions
  // Order matters: smaller/more specific states first to handle overlaps
  const stateRegions: Array<{ state: string; latMin: number; latMax: number; lngMin: number; lngMax: number; defaultDistrict: string }> = [
    // Smaller states first (to avoid being swallowed by larger neighbors)
    // Haryana before Punjab: Haryana surrounds Delhi and overlaps with Punjab in latitude.
    // Use longitude to distinguish: Punjab is west of ~76.0, Haryana is east of ~74.5
    { state: 'Haryana', latMin: 27.6, latMax: 30.9, lngMin: 75.6, lngMax: 77.6, defaultDistrict: 'General' },
    { state: 'Punjab', latMin: 29.5, latMax: 32.5, lngMin: 73.8, lngMax: 76.9, defaultDistrict: 'General' },
    // Kerala: narrow lng max to 76.6 to avoid capturing Mysuru (76.64) which is in Karnataka
    { state: 'Kerala', latMin: 8.2, latMax: 12.8, lngMin: 74.8, lngMax: 76.6, defaultDistrict: 'General' },
    { state: 'Assam', latMin: 24.1, latMax: 27.9, lngMin: 89.7, lngMax: 96.0, defaultDistrict: 'General' },
    { state: 'Jharkhand', latMin: 21.9, latMax: 25.3, lngMin: 83.3, lngMax: 87.9, defaultDistrict: 'General' },
    { state: 'Chhattisgarh', latMin: 17.8, latMax: 24.1, lngMin: 80.2, lngMax: 84.4, defaultDistrict: 'General' },

    // Telangana before AP (Telangana is carved out of AP, check it first)
    { state: 'Telangana', latMin: 15.8, latMax: 19.9, lngMin: 77.3, lngMax: 81.3, defaultDistrict: 'General' },

    // Karnataka before Tamil Nadu: Kolar (13.1, 78.1) is in Karnataka but overlaps TN lat range.
    // Karnataka extends to lng 78.6 and lat down to 11.6; TN narrower in lng (max ~80.3).
    // Check Karnataka first for lng > 77.0 in the overlap zone.
    { state: 'Karnataka', latMin: 11.6, latMax: 18.4, lngMin: 74.0, lngMax: 78.6, defaultDistrict: 'General' },
    { state: 'Tamil Nadu', latMin: 8.1, latMax: 13.6, lngMin: 76.2, lngMax: 80.3, defaultDistrict: 'General' },

    // Larger states
    { state: 'Maharashtra', latMin: 15.6, latMax: 22.0, lngMin: 72.6, lngMax: 80.9, defaultDistrict: 'General' },
    { state: 'Andhra Pradesh', latMin: 12.4, latMax: 19.1, lngMin: 77.0, lngMax: 84.8, defaultDistrict: 'General' },
    { state: 'Gujarat', latMin: 20.1, latMax: 24.7, lngMin: 68.2, lngMax: 74.5, defaultDistrict: 'General' },
    { state: 'Rajasthan', latMin: 23.0, latMax: 30.2, lngMin: 69.5, lngMax: 78.3, defaultDistrict: 'General' },
    // UP before MP: Lucknow (26.8, 80.9) overlaps both. UP is more specific for northern regions.
    { state: 'Uttar Pradesh', latMin: 23.9, latMax: 30.4, lngMin: 77.1, lngMax: 84.6, defaultDistrict: 'General' },
    { state: 'Madhya Pradesh', latMin: 21.0, latMax: 26.9, lngMin: 74.0, lngMax: 82.8, defaultDistrict: 'General' },
    { state: 'Bihar', latMin: 24.2, latMax: 27.5, lngMin: 83.3, lngMax: 88.2, defaultDistrict: 'General' },
    { state: 'West Bengal', latMin: 21.5, latMax: 27.2, lngMin: 86.0, lngMax: 89.9, defaultDistrict: 'General' },
    { state: 'Odisha', latMin: 17.8, latMax: 22.6, lngMin: 81.3, lngMax: 87.5, defaultDistrict: 'General' },
  ];

  for (const region of stateRegions) {
    if (lat >= region.latMin && lat <= region.latMax && lng >= region.lngMin && lng <= region.lngMax) {
      return { state: region.state, district: region.defaultDistrict };
    }
  }

  return { state: 'India', district: 'Unknown' };
}
