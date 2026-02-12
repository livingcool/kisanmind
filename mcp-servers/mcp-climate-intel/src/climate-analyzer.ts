/**
 * Climate Analyzer - Synthesizes forecast and climate normals
 * into actionable climate intelligence for farming
 */
import { fetchForecast } from './apis/open-meteo-forecast.js';
import { fetchClimateNormals } from './apis/nasa-power-climate.js';
import { Logger } from './utils/logger.js';
import type {
  ClimateAnalysisResult,
  ClimateRisk,
  CropClimateSuitability,
  DailyForecast,
} from './types.js';

const logger = new Logger('ClimateAnalyzer');

/**
 * Indian crop temperature requirements
 */
const CROP_TEMP_RANGES: Record<string, { min: number; max: number; optimal_min: number; optimal_max: number; season: string }> = {
  'Rice (Paddy)': { min: 20, max: 40, optimal_min: 25, optimal_max: 35, season: 'Kharif (Jun-Oct)' },
  'Wheat': { min: 5, max: 25, optimal_min: 10, optimal_max: 22, season: 'Rabi (Nov-Mar)' },
  'Cotton': { min: 20, max: 42, optimal_min: 25, optimal_max: 35, season: 'Kharif (Jun-Nov)' },
  'Soybean': { min: 18, max: 38, optimal_min: 22, optimal_max: 30, season: 'Kharif (Jun-Oct)' },
  'Sugarcane': { min: 15, max: 45, optimal_min: 25, optimal_max: 38, season: 'Annual' },
  'Groundnut': { min: 20, max: 40, optimal_min: 25, optimal_max: 35, season: 'Kharif (Jun-Oct)' },
  'Chickpea (Gram)': { min: 5, max: 30, optimal_min: 10, optimal_max: 25, season: 'Rabi (Oct-Feb)' },
  'Maize': { min: 15, max: 40, optimal_min: 22, optimal_max: 32, season: 'Kharif (Jun-Sep)' },
  'Mustard': { min: 5, max: 25, optimal_min: 10, optimal_max: 22, season: 'Rabi (Oct-Feb)' },
  'Turmeric': { min: 18, max: 38, optimal_min: 22, optimal_max: 32, season: 'Kharif (Jun-Jan)' },
  'Onion': { min: 10, max: 32, optimal_min: 15, optimal_max: 27, season: 'Rabi (Nov-Apr)' },
  'Tomato': { min: 15, max: 35, optimal_min: 20, optimal_max: 30, season: 'Multiple' },
};

/**
 * Determine current Indian agricultural season
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 5 && month <= 9) return 'Kharif (monsoon) season';
  if (month >= 10 || month <= 1) return 'Rabi (winter) season';
  return 'Zaid (summer) season';
}

/**
 * Assess climate risks from forecast and normals
 */
function assessClimateRisks(
  forecasts: DailyForecast[],
  _monthlyTempMax: { month: string; tempC: number }[],
  _monthlyTempMin: { month: string; tempC: number }[]
): ClimateRisk[] {
  const risks: ClimateRisk[] = [];

  // Check for heat waves in forecast
  const hotDays = forecasts.filter(f => f.tempMax > 40).length;
  if (hotDays >= 3) {
    risks.push({
      risk: 'Heat wave',
      severity: hotDays >= 5 ? 'critical' : 'high',
      probability: `${hotDays} days above 40C in next 16 days`,
      impact: 'Crop wilting, flower drop, reduced grain filling, livestock stress',
      mitigation: 'Increase irrigation frequency, apply mulch, provide shade for nurseries, spray potassium to reduce heat stress',
    });
  }

  // Check for cold spells
  const coldDays = forecasts.filter(f => f.tempMin < 5).length;
  if (coldDays >= 2) {
    risks.push({
      risk: 'Frost/cold wave',
      severity: coldDays >= 4 ? 'high' : 'moderate',
      probability: `${coldDays} days below 5C in next 16 days`,
      impact: 'Frost damage to young crops, delayed germination, flower damage',
      mitigation: 'Light irrigation before frost events, cover nurseries with polythene, smoke near fields at night',
    });
  }

  // Check for heavy rainfall events
  const heavyRainDays = forecasts.filter(f => f.precipitation_mm > 50).length;
  if (heavyRainDays >= 2) {
    risks.push({
      risk: 'Heavy rainfall / flooding',
      severity: heavyRainDays >= 4 ? 'critical' : 'high',
      probability: `${heavyRainDays} days with >50mm rainfall forecast`,
      impact: 'Waterlogging, root rot, nutrient leaching, crop lodging',
      mitigation: 'Clear drainage channels, harvest ready crops immediately, apply fungicide preventively',
    });
  }

  // Check for prolonged dry spell
  const dryDays = forecasts.filter(f => f.precipitation_mm < 1).length;
  if (dryDays >= 10) {
    risks.push({
      risk: 'Dry spell / moisture stress',
      severity: dryDays >= 14 ? 'high' : 'moderate',
      probability: `${dryDays} of 16 forecast days with no rain`,
      impact: 'Soil moisture depletion, crop wilting, reduced yields',
      mitigation: 'Arrange supplementary irrigation, apply mulch, prioritize water for critical growth stages',
    });
  }

  // Check for strong winds
  const windyDays = forecasts.filter(f => f.windSpeed > 40).length;
  if (windyDays >= 2) {
    risks.push({
      risk: 'Strong winds',
      severity: 'moderate',
      probability: `${windyDays} days with winds >40 km/h`,
      impact: 'Crop lodging, flower shedding, physical damage to plants',
      mitigation: 'Install windbreaks, stake tall crops, delay spraying operations',
    });
  }

  // High humidity disease risk
  const humidDays = forecasts.filter(f => f.humidity > 85).length;
  if (humidDays >= 5) {
    risks.push({
      risk: 'High humidity - disease risk',
      severity: 'moderate',
      probability: `${humidDays} days with >85% humidity`,
      impact: 'Fungal diseases (blast, blight, mildew), bacterial infections',
      mitigation: 'Preventive fungicide spray, maintain plant spacing for air circulation, avoid overhead irrigation',
    });
  }

  if (risks.length === 0) {
    risks.push({
      risk: 'No significant climate risks detected',
      severity: 'low',
      probability: 'Current conditions appear favorable',
      impact: 'Normal growing conditions expected',
      mitigation: 'Continue standard crop management practices',
    });
  }

  return risks;
}

/**
 * Assess frost risk from minimum temperatures
 */
function assessFrostRisk(
  monthlyTempMin: { month: string; tempC: number }[]
): ClimateAnalysisResult['growingConditions']['frostRisk'] {
  if (monthlyTempMin.length === 0) return null;
  const minTemp = Math.min(...monthlyTempMin.map(m => m.tempC));
  if (minTemp > 10) return 'none';
  if (minTemp > 5) return 'low';
  if (minTemp > 0) return 'moderate';
  return 'high';
}

/**
 * Assess heat stress risk from maximum temperatures
 */
function assessHeatStressRisk(
  monthlyTempMax: { month: string; tempC: number }[]
): ClimateAnalysisResult['growingConditions']['heatStressRisk'] {
  if (monthlyTempMax.length === 0) return null;
  const maxTemp = Math.max(...monthlyTempMax.map(m => m.tempC));
  if (maxTemp < 35) return 'none';
  if (maxTemp < 38) return 'low';
  if (maxTemp < 42) return 'moderate';
  return 'high';
}

/**
 * Determine optimal planting window based on climate
 */
function determineOptimalPlantingWindow(
  _monthlyTempMax: { month: string; tempC: number }[],
  _monthlyTempMin: { month: string; tempC: number }[],
  _monthlyRainfall: { month: string; mm: number }[]
): string {
  const season = getCurrentSeason();

  if (season.includes('Kharif')) {
    return 'Kharif planting: Sow after monsoon onset (typically mid-June). Ensure first good rain (>25mm) before sowing.';
  }
  if (season.includes('Rabi')) {
    return 'Rabi planting: Sow after monsoon withdrawal (October-November) when temperatures cool below 30C.';
  }
  return 'Zaid planting: Quick-maturing crops (vegetables, fodder) between March-May with irrigation.';
}

/**
 * Assess crop suitability based on climate
 */
function assessCropClimateSuitability(
  monthlyTempMax: { month: string; tempC: number }[],
  monthlyTempMin: { month: string; tempC: number }[]
): CropClimateSuitability[] {
  const results: CropClimateSuitability[] = [];

  for (const [crop, reqs] of Object.entries(CROP_TEMP_RANGES)) {
    // Get relevant season months
    const season = getCurrentSeason();
    let relevantMaxTemps: number[];
    let relevantMinTemps: number[];

    if (season.includes('Kharif')) {
      const kharifIndices = [5, 6, 7, 8, 9]; // Jun-Oct
      relevantMaxTemps = kharifIndices.map(i => monthlyTempMax[i]?.tempC ?? 30);
      relevantMinTemps = kharifIndices.map(i => monthlyTempMin[i]?.tempC ?? 20);
    } else if (season.includes('Rabi')) {
      const rabiIndices = [10, 11, 0, 1, 2]; // Nov-Mar
      relevantMaxTemps = rabiIndices.map(i => monthlyTempMax[i]?.tempC ?? 25);
      relevantMinTemps = rabiIndices.map(i => monthlyTempMin[i]?.tempC ?? 15);
    } else {
      const zaidIndices = [2, 3, 4]; // Mar-May
      relevantMaxTemps = zaidIndices.map(i => monthlyTempMax[i]?.tempC ?? 35);
      relevantMinTemps = zaidIndices.map(i => monthlyTempMin[i]?.tempC ?? 22);
    }

    const avgMax = relevantMaxTemps.reduce((a, b) => a + b, 0) / relevantMaxTemps.length;
    const avgMin = relevantMinTemps.reduce((a, b) => a + b, 0) / relevantMinTemps.length;
    const avgTemp = (avgMax + avgMin) / 2;

    let temperatureFit: CropClimateSuitability['temperatureFit'];
    let climateFit: string;

    if (avgTemp >= reqs.optimal_min && avgTemp <= reqs.optimal_max) {
      temperatureFit = 'optimal';
      climateFit = `Temperature (${avgTemp.toFixed(1)}C) is in the optimal range (${reqs.optimal_min}-${reqs.optimal_max}C)`;
    } else if (avgTemp >= reqs.min && avgTemp <= reqs.max) {
      temperatureFit = 'acceptable';
      climateFit = `Temperature (${avgTemp.toFixed(1)}C) is acceptable but not optimal (${reqs.optimal_min}-${reqs.optimal_max}C ideal)`;
    } else if (Math.abs(avgTemp - reqs.optimal_min) < 5 || Math.abs(avgTemp - reqs.optimal_max) < 5) {
      temperatureFit = 'marginal';
      climateFit = `Temperature (${avgTemp.toFixed(1)}C) is marginal for this crop (needs ${reqs.min}-${reqs.max}C)`;
    } else {
      temperatureFit = 'unsuitable';
      climateFit = `Temperature (${avgTemp.toFixed(1)}C) is outside the viable range (${reqs.min}-${reqs.max}C)`;
    }

    results.push({
      crop,
      temperatureFit,
      climateFit,
      bestSeason: reqs.season,
      notes: temperatureFit === 'optimal'
        ? 'Climate conditions are ideal for this crop'
        : temperatureFit === 'acceptable'
          ? 'Can be grown with careful management'
          : temperatureFit === 'marginal'
            ? 'High risk - consider alternative crops or protected cultivation'
            : 'Not recommended for current climate conditions',
    });
  }

  // Sort by suitability
  const order: Record<string, number> = { 'optimal': 0, 'acceptable': 1, 'marginal': 2, 'unsuitable': 3 };
  results.sort((a, b) => order[a.temperatureFit] - order[b.temperatureFit]);

  return results;
}

/**
 * Generate climate-based recommendations
 */
function generateRecommendations(
  _risks: ClimateRisk[],
  forecasts: DailyForecast[],
  frostRisk: string | null,
  heatStressRisk: string | null
): string[] {
  const recs: string[] = [];

  // Immediate weather-based recommendations
  const nextWeekRain = forecasts.slice(0, 7).reduce((sum, f) => sum + f.precipitation_mm, 0);
  if (nextWeekRain > 50) {
    recs.push(`Rain expected (${Math.round(nextWeekRain)}mm in 7 days) - delay fertilizer and pesticide applications`);
  } else if (nextWeekRain < 5) {
    recs.push('Dry week ahead - schedule irrigation for moisture-sensitive crops');
  }

  if (heatStressRisk === 'high' || heatStressRisk === 'moderate') {
    recs.push('Prepare for heat stress: increase irrigation frequency, apply kaolin spray on sensitive crops');
  }

  if (frostRisk === 'moderate' || frostRisk === 'high') {
    recs.push('Frost risk present: protect nurseries, apply light irrigation on frost nights');
  }

  // General seasonal advice
  const season = getCurrentSeason();
  if (season.includes('Kharif')) {
    recs.push('Kharif season: Prepare fields for sowing after monsoon onset, ensure seed and fertilizer availability');
  } else if (season.includes('Rabi')) {
    recs.push('Rabi season: Monitor night temperatures, protect wheat/gram from frost, plan irrigation schedule');
  } else {
    recs.push('Summer season: Focus on water management, grow short-duration vegetables if irrigation available');
  }

  recs.push('Subscribe to local weather alerts for timely crop protection decisions');

  return recs;
}

/**
 * Perform comprehensive climate analysis for a given location
 */
export async function analyzeClimate(lat: number, lng: number): Promise<ClimateAnalysisResult> {
  logger.info(`Starting climate analysis for ${lat}, ${lng}`);
  const startTime = Date.now();

  const dataSources: string[] = [];
  let status: ClimateAnalysisResult['status'] = 'success';

  // Fetch from both sources in parallel
  const [forecastResult, normalsResult] = await Promise.allSettled([
    fetchForecast(lat, lng),
    fetchClimateNormals(lat, lng),
  ]);

  let currentTemp: number | null = null;
  let currentHumidity: number | null = null;
  let currentWindSpeed: number | null = null;
  let currentCondition: string | null = null;
  let dailyForecasts: DailyForecast[] = [];

  if (forecastResult.status === 'fulfilled') {
    const fr = forecastResult.value;
    currentTemp = fr.currentTemp;
    currentHumidity = fr.currentHumidity;
    currentWindSpeed = fr.currentWindSpeed;
    currentCondition = fr.currentCondition;
    dailyForecasts = fr.dailyForecasts;
    dataSources.push('Open-Meteo (16-day forecast)');
  } else {
    status = 'partial';
    logger.warn('Forecast data unavailable');
  }

  let monthlyTempMax: { month: string; tempC: number }[] = [];
  let monthlyTempMin: { month: string; tempC: number }[] = [];
  let monthlyRainfall: { month: string; mm: number }[] = [];
  let growingDegreeDays: number | null = null;

  if (normalsResult.status === 'fulfilled') {
    monthlyTempMax = normalsResult.value.monthlyTempMax;
    monthlyTempMin = normalsResult.value.monthlyTempMin;
    monthlyRainfall = normalsResult.value.monthlyRainfall;
    growingDegreeDays = normalsResult.value.growingDegreeDays;
    dataSources.push('NASA POWER (10-year climatology)');
  } else {
    if (status !== 'partial') status = 'partial';
    logger.warn('Climate normals data unavailable');
  }

  if (dataSources.length === 0) status = 'error';

  // Derive analysis
  const climateRisks = assessClimateRisks(dailyForecasts, monthlyTempMax, monthlyTempMin);
  const frostRisk = assessFrostRisk(monthlyTempMin);
  const heatStressRisk = assessHeatStressRisk(monthlyTempMax);
  const plantingWindow = determineOptimalPlantingWindow(monthlyTempMax, monthlyTempMin, monthlyRainfall);
  const cropClimateMatch = assessCropClimateSuitability(monthlyTempMax, monthlyTempMin);
  const recommendations = generateRecommendations(climateRisks, dailyForecasts, frostRisk, heatStressRisk);

  // Temperature and rainfall trends
  const currentMonth = new Date().getMonth();
  const tempTrend = monthlyTempMax.length > 0
    ? `Current month average max: ${monthlyTempMax[currentMonth]?.tempC ?? 'N/A'}C, min: ${monthlyTempMin[currentMonth]?.tempC ?? 'N/A'}C`
    : 'Temperature data unavailable';

  const rainTrend = monthlyRainfall.length > 0
    ? `Current month average rainfall: ${monthlyRainfall[currentMonth]?.mm ?? 'N/A'}mm`
    : 'Rainfall data unavailable';

  const elapsed = Date.now() - startTime;
  logger.info(`Climate analysis completed in ${elapsed}ms with status: ${status}`);

  return {
    status,
    location: { latitude: lat, longitude: lng },
    currentWeather: {
      temperature: currentTemp,
      humidity: currentHumidity,
      windSpeed: currentWindSpeed,
      condition: currentCondition,
    },
    forecast: dailyForecasts,
    seasonalOutlook: {
      currentSeason: getCurrentSeason(),
      temperatureTrend: tempTrend,
      rainfallTrend: rainTrend,
      advisories: climateRisks.filter(r => r.severity !== 'low').map(r => `${r.risk}: ${r.probability}`),
    },
    climateRisks,
    growingConditions: {
      growingDegreeDays,
      frostRisk,
      heatStressRisk,
      optimalPlantingWindow: plantingWindow,
    },
    cropClimateMatch,
    recommendations,
    dataSources,
    timestamp: new Date().toISOString(),
  };
}
