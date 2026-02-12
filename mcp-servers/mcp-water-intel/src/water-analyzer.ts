/**
 * Water Analyzer - Aggregates data from NASA POWER, Open-Meteo
 * to produce a comprehensive water assessment for farming
 */
import { fetchNASAPowerData } from './apis/nasa-power.js';
import { fetchOpenMeteoData } from './apis/open-meteo.js';
import { Logger } from './utils/logger.js';
import type { WaterAnalysisResult, CropWaterNeed, MonthlyRainfall } from './types.js';

const logger = new Logger('WaterAnalyzer');

/**
 * Crop water requirement reference data (mm per growing season)
 */
const CROP_WATER_REQUIREMENTS: Record<string, { water_mm: number; season: string }> = {
  'Rice (Paddy)': { water_mm: 1200, season: 'Kharif (Jun-Oct)' },
  'Wheat': { water_mm: 450, season: 'Rabi (Nov-Mar)' },
  'Cotton': { water_mm: 700, season: 'Kharif (Jun-Nov)' },
  'Soybean': { water_mm: 500, season: 'Kharif (Jun-Oct)' },
  'Sugarcane': { water_mm: 1500, season: 'Annual (Jan-Dec)' },
  'Groundnut': { water_mm: 500, season: 'Kharif (Jun-Oct)' },
  'Chickpea (Gram)': { water_mm: 300, season: 'Rabi (Oct-Feb)' },
  'Turmeric': { water_mm: 750, season: 'Kharif (Jun-Jan)' },
  'Maize': { water_mm: 500, season: 'Kharif (Jun-Sep)' },
  'Onion': { water_mm: 400, season: 'Rabi (Nov-Apr)' },
  'Tomato': { water_mm: 600, season: 'Multiple seasons' },
  'Mustard': { water_mm: 250, season: 'Rabi (Oct-Feb)' },
};

/**
 * Determine monsoon reliability based on monthly rainfall pattern
 */
function assessMonsoonReliability(monthlyRainfall: MonthlyRainfall[]): string {
  if (monthlyRainfall.length === 0) return 'Unknown';

  // Indian monsoon months: June (5), July (6), August (7), September (8)
  const monsoonMonths = ['Jun', 'Jul', 'Aug', 'Sep'];
  const monsoonRain = monthlyRainfall
    .filter(m => monsoonMonths.includes(m.month))
    .reduce((sum, m) => sum + m.rainfall_mm, 0);

  const totalRain = monthlyRainfall.reduce((sum, m) => sum + m.rainfall_mm, 0);

  if (totalRain === 0) return 'Very poor - arid region';

  const monsoonRatio = monsoonRain / totalRain;

  if (monsoonRatio > 0.75 && monsoonRain > 600) return 'Good - strong monsoon dependence with adequate volume';
  if (monsoonRatio > 0.75 && monsoonRain > 300) return 'Moderate - monsoon dependent but low volume';
  if (monsoonRatio > 0.5) return 'Moderate - significant monsoon contribution';
  if (monsoonRatio > 0.3) return 'Distributed - rainfall spread across seasons';
  return 'Low monsoon dependence - may be in arid/semi-arid zone';
}

/**
 * Assess drought risk from rainfall patterns
 */
function assessDroughtRisk(annualRainfall: number | null): WaterAnalysisResult['rainfall']['droughtRisk'] {
  if (annualRainfall === null) return null;

  if (annualRainfall < 250) return 'very_high';
  if (annualRainfall < 500) return 'high';
  if (annualRainfall < 750) return 'moderate';
  return 'low';
}

/**
 * Determine water availability rating
 */
function assessWaterAvailability(
  annualRainfall: number | null,
  _recentRainfall: number
): WaterAnalysisResult['irrigationAssessment']['waterAvailability'] {
  if (annualRainfall === null) return null;

  const effectiveRainfall = annualRainfall * 0.7; // 70% effective rainfall
  if (effectiveRainfall > 1000) return 'abundant';
  if (effectiveRainfall > 600) return 'adequate';
  if (effectiveRainfall > 300) return 'limited';
  return 'scarce';
}

/**
 * Recommend irrigation method based on water availability
 */
function recommendIrrigationMethod(
  waterAvailability: WaterAnalysisResult['irrigationAssessment']['waterAvailability'],
  annualRainfall: number | null
): string {
  if (waterAvailability === 'scarce' || (annualRainfall !== null && annualRainfall < 400)) {
    return 'Drip irrigation strongly recommended - conserves 30-60% water. Micro-sprinkler as secondary option.';
  }
  if (waterAvailability === 'limited') {
    return 'Drip or sprinkler irrigation recommended. Furrow irrigation acceptable for flood-tolerant crops. Mulching advised.';
  }
  if (waterAvailability === 'adequate') {
    return 'Sprinkler or furrow irrigation suitable. Drip recommended for high-value crops. Rainwater harvesting beneficial.';
  }
  return 'Multiple irrigation methods feasible. Flood irrigation acceptable for paddy. Consider water harvesting for dry spells.';
}

/**
 * Generate water budget summary
 */
function generateWaterBudget(
  annualRainfall: number | null,
  annualET: number | null
): string {
  if (annualRainfall === null || annualET === null) {
    return 'Insufficient data to calculate water budget. Recommend local groundwater assessment.';
  }

  const deficit = annualET - annualRainfall;
  if (deficit <= 0) {
    return `Water surplus: Rainfall (${annualRainfall}mm) exceeds evapotranspiration (${annualET}mm). Good water availability, but drainage management needed.`;
  }

  const deficitPercent = Math.round((deficit / annualET) * 100);
  return `Water deficit of ${Math.round(deficit)}mm/year (${deficitPercent}% shortfall). Rainfall: ${annualRainfall}mm, ET: ${annualET}mm. Irrigation needed to meet crop demands.`;
}

/**
 * Assess crop water feasibility
 */
function assessCropWaterNeeds(
  annualRainfall: number | null,
  monthlyRainfall: MonthlyRainfall[]
): CropWaterNeed[] {
  const needs: CropWaterNeed[] = [];
  const effectiveRainfall = annualRainfall !== null ? annualRainfall * 0.7 : 0;

  // Calculate seasonal rainfall
  const kharifMonths = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const rabiMonths = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  const kharifRain = monthlyRainfall
    .filter(m => kharifMonths.includes(m.month))
    .reduce((sum, m) => sum + m.rainfall_mm, 0) * 0.7;

  const rabiRain = monthlyRainfall
    .filter(m => rabiMonths.includes(m.month))
    .reduce((sum, m) => sum + m.rainfall_mm, 0) * 0.7;

  for (const [crop, req] of Object.entries(CROP_WATER_REQUIREMENTS)) {
    const isKharif = req.season.includes('Kharif');
    const isRabi = req.season.includes('Rabi');
    const isAnnual = req.season.includes('Annual');

    let availableWater: number;
    if (isAnnual) availableWater = effectiveRainfall;
    else if (isKharif) availableWater = kharifRain;
    else if (isRabi) availableWater = rabiRain;
    else availableWater = effectiveRainfall / 2;

    const irrigationNeeded = availableWater < req.water_mm;
    const deficit = req.water_mm - availableWater;
    const coverageRatio = availableWater / req.water_mm;

    let feasibility: CropWaterNeed['feasibility'];
    let notes: string;

    if (coverageRatio >= 0.9) {
      feasibility = 'highly_feasible';
      notes = `Rainfall covers ${Math.round(coverageRatio * 100)}% of water needs. Minimal irrigation needed.`;
    } else if (coverageRatio >= 0.6) {
      feasibility = 'feasible';
      notes = `Rainfall covers ${Math.round(coverageRatio * 100)}% of water needs. Supplementary irrigation of ~${Math.round(deficit)}mm required (${req.season}).`;
    } else if (coverageRatio >= 0.3) {
      feasibility = 'marginal';
      notes = `Rainfall covers only ${Math.round(coverageRatio * 100)}% of water needs. Significant irrigation (~${Math.round(deficit)}mm) required. Consider drip irrigation.`;
    } else {
      feasibility = 'not_feasible';
      notes = `Severe water deficit. Rainfall covers only ${Math.round(coverageRatio * 100)}% of needs. Not recommended without reliable irrigation source.`;
    }

    needs.push({
      crop,
      waterRequirement_mm: req.water_mm,
      irrigationNeeded,
      feasibility,
      notes,
    });
  }

  // Sort by feasibility
  const order: Record<string, number> = { 'highly_feasible': 0, 'feasible': 1, 'marginal': 2, 'not_feasible': 3 };
  needs.sort((a, b) => order[a.feasibility] - order[b.feasibility]);

  return needs;
}

/**
 * Generate water management recommendations
 */
function generateRecommendations(
  annualRainfall: number | null,
  droughtRisk: string | null,
  waterAvailability: string | null,
  recentRainfall: number,
  forecastRainfall: number
): string[] {
  const recommendations: string[] = [];

  if (annualRainfall !== null && annualRainfall < 500) {
    recommendations.push('Construct farm pond or rainwater harvesting structure to capture monsoon runoff');
    recommendations.push('Adopt drip irrigation to maximize water use efficiency');
    recommendations.push('Choose drought-tolerant crop varieties');
  }

  if (droughtRisk === 'high' || droughtRisk === 'very_high') {
    recommendations.push('Apply mulching (crop residue or plastic) to reduce soil evaporation by 25-40%');
    recommendations.push('Practice deficit irrigation scheduling based on critical crop growth stages');
  }

  if (waterAvailability === 'abundant') {
    recommendations.push('Ensure proper field drainage to prevent waterlogging');
    recommendations.push('Consider paddy cultivation or fish-rice integrated farming');
  }

  if (recentRainfall < 10 && forecastRainfall < 20) {
    recommendations.push('ALERT: Dry conditions detected. Prepare supplementary irrigation immediately');
  }

  if (forecastRainfall > 100) {
    recommendations.push('Heavy rainfall forecast in next 16 days. Ensure field drainage channels are clear');
  }

  if (recommendations.length === 0) {
    recommendations.push('Water conditions appear normal. Follow standard irrigation scheduling for your crops');
    recommendations.push('Monitor weather forecasts weekly and adjust irrigation accordingly');
  }

  recommendations.push('Get borewell water tested for salinity and mineral content before crop planning');

  return recommendations;
}

/**
 * Perform comprehensive water analysis for a given location
 */
export async function analyzeWater(lat: number, lng: number): Promise<WaterAnalysisResult> {
  logger.info(`Starting water analysis for ${lat}, ${lng}`);
  const startTime = Date.now();

  const dataSources: string[] = [];
  let status: WaterAnalysisResult['status'] = 'success';

  // Fetch from both APIs in parallel
  const [nasaResult, meteoResult] = await Promise.allSettled([
    fetchNASAPowerData(lat, lng),
    fetchOpenMeteoData(lat, lng),
  ]);

  let annualRainfall: number | null = null;
  let monthlyRainfall: MonthlyRainfall[] = [];
  let annualET: number | null = null;
  let recentRainfall = 0;
  let forecastRainfall = 0;

  if (nasaResult.status === 'fulfilled' && nasaResult.value.annualRainfall !== null) {
    annualRainfall = nasaResult.value.annualRainfall;
    monthlyRainfall = nasaResult.value.monthlyRainfall;
    annualET = nasaResult.value.annualEvapotranspiration;
    dataSources.push('NASA POWER (5-year climatology)');
  } else {
    status = 'partial';
    logger.warn('NASA POWER data unavailable');
  }

  if (meteoResult.status === 'fulfilled') {
    recentRainfall = meteoResult.value.recentRainfall_mm;
    forecastRainfall = meteoResult.value.forecastRainfall_mm;
    dataSources.push('Open-Meteo (current & forecast)');
  } else {
    if (status !== 'partial') status = 'partial';
    logger.warn('Open-Meteo data unavailable');
  }

  if (dataSources.length === 0) status = 'error';

  const monsoonReliability = assessMonsoonReliability(monthlyRainfall);
  const droughtRisk = assessDroughtRisk(annualRainfall);
  const waterAvailability = assessWaterAvailability(annualRainfall, recentRainfall);
  const irrigationMethod = recommendIrrigationMethod(waterAvailability, annualRainfall);
  const waterBudget = generateWaterBudget(annualRainfall, annualET);
  const cropWaterNeeds = assessCropWaterNeeds(annualRainfall, monthlyRainfall);
  const recommendations = generateRecommendations(
    annualRainfall, droughtRisk, waterAvailability, recentRainfall, forecastRainfall
  );

  const elapsed = Date.now() - startTime;
  logger.info(`Water analysis completed in ${elapsed}ms with status: ${status}`);

  return {
    status,
    location: { latitude: lat, longitude: lng },
    rainfall: {
      annualAverage: annualRainfall,
      monthlyDistribution: monthlyRainfall,
      monsoonReliability,
      droughtRisk,
    },
    groundwater: {
      depthToWaterTable: null, // Would need CGWB data
      depletionTrend: 'Data not available - recommend local borewell assessment',
      quality: null,
      rechargeRate: annualRainfall !== null
        ? `Estimated ${Math.round(annualRainfall * 0.15)}mm/year (15% of rainfall) based on typical infiltration rates`
        : null,
    },
    irrigationAssessment: {
      waterAvailability,
      recommendedMethod: irrigationMethod,
      waterBudget,
    },
    cropWaterRequirements: cropWaterNeeds,
    recommendations,
    dataSources,
    timestamp: new Date().toISOString(),
  };
}
