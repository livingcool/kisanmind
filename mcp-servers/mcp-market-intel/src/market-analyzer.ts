/**
 * Market Analyzer - Aggregates crop price data, nearby mandis,
 * profit estimates, and market intelligence for farming decisions
 */
import { Logger } from './utils/logger.js';
import { CROP_ECONOMICS, MAJOR_MANDIS, approximateLocation } from './data/crop-reference.js';
import type {
  MarketAnalysisResult,
  CropPriceInfo,
  MandiInfo,
  MarketTrend,
  ProfitEstimate,
} from './types.js';

const logger = new Logger('MarketAnalyzer');

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearby mandis sorted by distance
 */
function findNearbyMandis(lat: number, lng: number, maxResults: number = 5): MandiInfo[] {
  const allMandis: MandiInfo[] = [];

  for (const [state, mandis] of Object.entries(MAJOR_MANDIS)) {
    for (const mandi of mandis) {
      const distance = haversineDistance(lat, lng, mandi.lat, mandi.lng);
      allMandis.push({
        name: mandi.name,
        district: mandi.district,
        state,
        distance_km: Math.round(distance),
        latitude: mandi.lat,
        longitude: mandi.lng,
        majorCrops: mandi.majorCrops,
      });
    }
  }

  allMandis.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
  return allMandis.slice(0, maxResults);
}

/**
 * Generate crop price information with simulated current prices
 * In production, these would come from live API calls to Agmarknet/eNAM
 */
function generateCropPrices(state: string): CropPriceInfo[] {
  const currentMonth = new Date().getMonth();

  return CROP_ECONOMICS.map(crop => {
    const [minPrice, maxPrice] = crop.typical_market_price_range;
    const priceRange = maxPrice - minPrice;

    // Simulate seasonal price variation
    const isBestMonth = crop.best_selling_months.includes(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][currentMonth]
    );

    // Price is higher during best selling months
    const basePrice = isBestMonth
      ? minPrice + priceRange * 0.7
      : minPrice + priceRange * 0.4;

    // Add regional variation
    const regionalFactor = state === 'Punjab' || state === 'Madhya Pradesh' ? 0.95 : 1.0;
    const currentPrice = Math.round(basePrice * regionalFactor);

    // Determine trend based on seasonal pattern
    const monthsUntilBestSelling = crop.best_selling_months.includes(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(currentMonth + 1) % 12]
    );

    let trend: CropPriceInfo['trend'] = 'stable';
    if (monthsUntilBestSelling) trend = 'rising';
    else if (isBestMonth) trend = 'stable';
    else trend = 'falling';

    return {
      crop: crop.crop,
      variety: crop.varieties[0],
      currentPrice,
      msp: crop.msp_per_quintal > 0 ? crop.msp_per_quintal : null,
      unit: 'INR/quintal',
      trend,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  });
}

/**
 * Generate market trends
 */
function generateMarketTrends(): MarketTrend[] {
  return CROP_ECONOMICS.map(crop => ({
    crop: crop.crop,
    shortTermOutlook: crop.seasonal_price_pattern,
    seasonalPattern: crop.seasonal_price_pattern,
    bestSellingMonth: crop.best_selling_months.join(', '),
    riskFactors: crop.risk_factors,
  }));
}

/**
 * Generate profit estimates for each crop
 */
function generateProfitEstimates(state: string): ProfitEstimate[] {
  const prices = generateCropPrices(state);

  return CROP_ECONOMICS.map(crop => {
    const priceInfo = prices.find(p => p.crop === crop.crop);
    const expectedPrice = priceInfo?.currentPrice ?? crop.typical_market_price_range[0];

    const revenue = crop.avg_yield_quintal_per_acre * expectedPrice;
    const profit = revenue - crop.cost_of_cultivation_per_acre;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    let riskLevel: ProfitEstimate['riskLevel'] = 'moderate';
    if (margin > 40 && crop.risk_factors.length <= 2) riskLevel = 'low';
    else if (margin < 15 || crop.risk_factors.length >= 4) riskLevel = 'high';

    const notes = profit > 0
      ? `Expected profit of INR ${Math.round(profit).toLocaleString()} per acre. ${crop.seasonal_price_pattern}`
      : `Risk of loss. Consider only if MSP procurement is available in your area.`;

    return {
      crop: crop.crop,
      expectedYield_quintal_per_acre: crop.avg_yield_quintal_per_acre,
      expectedPrice_per_quintal: expectedPrice,
      estimatedCost_per_acre: crop.cost_of_cultivation_per_acre,
      estimatedRevenue_per_acre: revenue,
      estimatedProfit_per_acre: profit,
      profitMargin_percent: Math.round(margin),
      riskLevel,
      notes,
    };
  }).sort((a, b) => b.estimatedProfit_per_acre - a.estimatedProfit_per_acre);
}

/**
 * Generate market recommendations
 */
function generateRecommendations(
  profitEstimates: ProfitEstimate[],
  nearbyMandis: MandiInfo[],
  state: string
): string[] {
  const recs: string[] = [];

  // Top 3 most profitable crops
  const topCrops = profitEstimates.slice(0, 3);
  if (topCrops.length > 0) {
    recs.push(
      `Top 3 crops by profit potential: ${topCrops.map(c => `${c.crop} (INR ${Math.round(c.estimatedProfit_per_acre).toLocaleString()}/acre)`).join(', ')}`
    );
  }

  // Nearest mandi
  if (nearbyMandis.length > 0) {
    const nearest = nearbyMandis[0];
    recs.push(`Nearest market: ${nearest.name}, ${nearest.district} (${nearest.distance_km}km). Major crops: ${nearest.majorCrops.join(', ')}`);

    // Warn if nearest mandi is very far (suggests sparse coverage area)
    if (nearest.distance_km !== null && nearest.distance_km > 200) {
      recs.push(
        `Note: The nearest mandi in our database is ${nearest.distance_km}km away. ` +
        'There may be closer local mandis not yet in our system. Check with your local agriculture office.'
      );
    }
  } else {
    recs.push(
      `Mandi data for ${state} is being expanded. ` +
      'Contact your local agriculture office or visit enam.gov.in to find the nearest registered mandi.'
    );
  }

  // MSP advice
  const mspCrops = profitEstimates.filter(p => {
    const econ = CROP_ECONOMICS.find(c => c.crop === p.crop);
    return econ && econ.msp_per_quintal > 0;
  });
  if (mspCrops.length > 0) {
    recs.push(`Crops with MSP support: ${mspCrops.map(c => c.crop).join(', ')}. Register at nearest procurement center for guaranteed price.`);
  }

  // Storage advice
  recs.push('Store non-perishable crops (gram, soybean, mustard) for 2-3 months post-harvest for 10-20% higher prices');
  recs.push('Register on eNAM (National Agriculture Market) portal for access to buyers across India');
  recs.push('DISCLAIMER: Prices are estimates based on historical patterns. Verify current prices at your local mandi before making planting decisions.');

  return recs;
}

/**
 * Perform comprehensive market analysis for a given location
 */
export async function analyzeMarket(lat: number, lng: number): Promise<MarketAnalysisResult> {
  logger.info(`Starting market analysis for ${lat}, ${lng}`);
  const startTime = Date.now();

  const location = approximateLocation(lat, lng);
  const state = location.state;
  const district = location.district;

  const nearbyMandis = findNearbyMandis(lat, lng);
  const cropPrices = generateCropPrices(state);
  const marketTrends = generateMarketTrends();
  const profitEstimates = generateProfitEstimates(state);
  const recommendations = generateRecommendations(profitEstimates, nearbyMandis, state);

  // If we found a nearby mandi in a specific district, refine the district
  const refinedDistrict = nearbyMandis.length > 0 && nearbyMandis[0].distance_km !== null && nearbyMandis[0].distance_km < 100
    ? nearbyMandis[0].district
    : district;

  const elapsed = Date.now() - startTime;
  logger.info(`Market analysis completed in ${elapsed}ms`);

  return {
    status: 'success',
    location: {
      latitude: lat,
      longitude: lng,
      state,
      district: refinedDistrict,
    },
    cropPrices,
    nearbyMandis,
    marketTrends,
    profitEstimates,
    recommendations,
    dataSources: [
      'KisanMind crop economics database (MSP 2024-25)',
      'Historical Agmarknet price patterns',
      'ICAR cost of cultivation studies',
    ],
    timestamp: new Date().toISOString(),
  };
}
