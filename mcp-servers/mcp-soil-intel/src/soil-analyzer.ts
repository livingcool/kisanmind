/**
 * Soil Analyzer - Aggregates data from multiple soil APIs
 * and produces a comprehensive soil analysis result
 */
import { fetchSoilGridsData, extractPropertyValue } from './apis/soilgrids.js';
import { fetchOpenLandMapData } from './apis/openlandmap.js';
import { Logger } from './utils/logger.js';
import type { SoilAnalysisResult, SoilPropertyValue, CropSuitability } from './types.js';

const logger = new Logger('SoilAnalyzer');

/**
 * Rate a soil property value on a qualitative scale
 */
function rateSoilProperty(property: string, value: number): SoilPropertyValue['rating'] {
  const thresholds: Record<string, [number, number, number, number]> = {
    // [very_low_max, low_max, medium_max, high_max] -- above high_max = very_high
    pH: [4.5, 5.5, 6.5, 7.5],
    organicCarbon: [0.5, 1.0, 2.0, 3.0],
    nitrogen: [0.05, 0.1, 0.2, 0.3],
    clay: [10, 20, 35, 50],
    sand: [20, 40, 60, 80],
    silt: [10, 20, 35, 50],
    cec: [5, 10, 20, 30],
    bulkDensity: [1.0, 1.2, 1.4, 1.6],
  };

  const t = thresholds[property];
  if (!t) return 'medium';

  if (value <= t[0]) return 'very_low';
  if (value <= t[1]) return 'low';
  if (value <= t[2]) return 'medium';
  if (value <= t[3]) return 'high';
  return 'very_high';
}

/**
 * Determine soil texture class based on clay/sand/silt percentages
 */
function determineSoilTexture(clay: number | null, sand: number | null, silt: number | null): string {
  if (clay === null || sand === null || silt === null) {
    return 'Unknown (insufficient data)';
  }

  if (sand > 85) return 'Sandy';
  if (clay > 40) return 'Clay';
  if (silt > 80) return 'Silty';
  if (clay > 27 && sand > 20 && sand <= 45) return 'Clay Loam';
  if (clay > 27 && sand > 45) return 'Sandy Clay';
  if (silt > 50 && clay > 27) return 'Silty Clay';
  if (sand > 52 && clay < 20) return 'Sandy Loam';
  if (silt > 50 && clay < 27) return 'Silt Loam';
  return 'Loam';
}

/**
 * Determine drainage class from soil properties
 */
function determineDrainageClass(clay: number | null, sand: number | null): string {
  if (clay === null || sand === null) return 'Unknown';

  if (sand > 70) return 'Excessively drained';
  if (sand > 50) return 'Well drained';
  if (clay > 40) return 'Poorly drained';
  if (clay > 30) return 'Somewhat poorly drained';
  return 'Moderately well drained';
}

/**
 * Generate crop suitability recommendations based on soil properties
 */
function assessCropSuitability(
  pH: number | null,
  organicCarbon: number | null,
  clay: number | null,
  sand: number | null,
  texture: string,
  drainage: string
): CropSuitability[] {
  const crops: CropSuitability[] = [];

  // Rice
  if (clay !== null && clay > 25 && pH !== null && pH >= 5.0 && pH <= 7.5) {
    crops.push({ crop: 'Rice (Paddy)', suitability: 'highly_suitable', reason: 'Clay-rich soil with good water retention, suitable pH range' });
  } else if (clay !== null && clay > 15) {
    crops.push({ crop: 'Rice (Paddy)', suitability: 'moderately_suitable', reason: 'Moderate clay content; may need water management' });
  } else {
    crops.push({ crop: 'Rice (Paddy)', suitability: 'not_suitable', reason: 'Sandy soil with poor water retention' });
  }

  // Wheat
  if (texture === 'Loam' || texture === 'Clay Loam' || texture === 'Silt Loam') {
    if (pH !== null && pH >= 6.0 && pH <= 7.5) {
      crops.push({ crop: 'Wheat', suitability: 'highly_suitable', reason: 'Ideal loamy soil with neutral pH' });
    } else {
      crops.push({ crop: 'Wheat', suitability: 'suitable', reason: 'Good soil texture, pH may need adjustment' });
    }
  } else {
    crops.push({ crop: 'Wheat', suitability: 'moderately_suitable', reason: 'Soil texture is not ideal for wheat' });
  }

  // Cotton
  if (pH !== null && pH >= 5.8 && pH <= 8.0 && drainage !== 'Poorly drained') {
    if (texture.includes('Loam') || texture === 'Clay Loam') {
      crops.push({ crop: 'Cotton', suitability: 'highly_suitable', reason: 'Well-drained loamy soil with suitable pH' });
    } else {
      crops.push({ crop: 'Cotton', suitability: 'suitable', reason: 'Adequate drainage and pH for cotton' });
    }
  } else {
    crops.push({ crop: 'Cotton', suitability: 'marginally_suitable', reason: 'Drainage or pH concerns for cotton cultivation' });
  }

  // Soybean
  if (pH !== null && pH >= 6.0 && pH <= 7.0 && organicCarbon !== null && organicCarbon > 1.0) {
    crops.push({ crop: 'Soybean', suitability: 'highly_suitable', reason: 'Good organic matter and ideal pH for soybean' });
  } else if (pH !== null && pH >= 5.5 && pH <= 7.5) {
    crops.push({ crop: 'Soybean', suitability: 'suitable', reason: 'Acceptable pH range for soybean' });
  } else {
    crops.push({ crop: 'Soybean', suitability: 'marginally_suitable', reason: 'pH outside optimal range' });
  }

  // Sugarcane
  if (pH !== null && pH >= 5.0 && pH <= 8.5 && drainage !== 'Excessively drained') {
    if (organicCarbon !== null && organicCarbon > 1.5) {
      crops.push({ crop: 'Sugarcane', suitability: 'highly_suitable', reason: 'Rich soil with good moisture retention' });
    } else {
      crops.push({ crop: 'Sugarcane', suitability: 'suitable', reason: 'Acceptable conditions for sugarcane' });
    }
  } else {
    crops.push({ crop: 'Sugarcane', suitability: 'marginally_suitable', reason: 'Soil drainage or pH not ideal' });
  }

  // Groundnut (Peanut)
  if (sand !== null && sand > 40 && pH !== null && pH >= 5.5 && pH <= 7.0) {
    crops.push({ crop: 'Groundnut', suitability: 'highly_suitable', reason: 'Sandy well-drained soil with suitable pH' });
  } else if (drainage !== 'Poorly drained') {
    crops.push({ crop: 'Groundnut', suitability: 'moderately_suitable', reason: 'Needs sandier, well-drained soil' });
  } else {
    crops.push({ crop: 'Groundnut', suitability: 'not_suitable', reason: 'Poorly drained soil unsuitable for groundnut' });
  }

  // Chickpea (Gram)
  if (pH !== null && pH >= 6.0 && pH <= 8.0 && drainage !== 'Poorly drained') {
    crops.push({ crop: 'Chickpea (Gram)', suitability: 'highly_suitable', reason: 'Well-drained soil with suitable pH' });
  } else {
    crops.push({ crop: 'Chickpea (Gram)', suitability: 'moderately_suitable', reason: 'Drainage or pH concerns' });
  }

  // Turmeric
  if (organicCarbon !== null && organicCarbon > 1.5 && pH !== null && pH >= 5.0 && pH <= 7.5) {
    crops.push({ crop: 'Turmeric', suitability: 'highly_suitable', reason: 'Rich organic soil with suitable pH' });
  } else {
    crops.push({ crop: 'Turmeric', suitability: 'moderately_suitable', reason: 'May need organic matter supplementation' });
  }

  return crops;
}

/**
 * Generate fertility summary from soil properties
 */
function generateFertilitySummary(
  pH: number | null,
  organicCarbon: number | null,
  nitrogen: number | null,
  cec: number | null,
  texture: string
): string {
  const parts: string[] = [];

  if (pH !== null) {
    if (pH < 5.5) parts.push(`Acidic soil (pH ${pH.toFixed(1)}) - lime application recommended`);
    else if (pH > 7.5) parts.push(`Alkaline soil (pH ${pH.toFixed(1)}) - gypsum application may help`);
    else parts.push(`Neutral to slightly acidic soil (pH ${pH.toFixed(1)}) - good for most crops`);
  }

  if (organicCarbon !== null) {
    if (organicCarbon < 0.5) parts.push('Very low organic carbon - needs heavy organic matter addition');
    else if (organicCarbon < 1.0) parts.push('Low organic carbon - add compost and green manure');
    else if (organicCarbon > 2.0) parts.push('Good organic carbon content');
    else parts.push('Moderate organic carbon');
  }

  if (nitrogen !== null) {
    if (nitrogen < 0.1) parts.push('Low nitrogen - needs nitrogen-rich fertilization');
    else if (nitrogen > 0.2) parts.push('Good nitrogen levels');
    else parts.push('Moderate nitrogen levels');
  }

  if (cec !== null) {
    if (cec < 10) parts.push('Low nutrient holding capacity - split fertilizer applications');
    else if (cec > 20) parts.push('High nutrient holding capacity - good fertility potential');
  }

  parts.push(`Soil texture: ${texture}`);

  return parts.join('. ') + '.';
}

/**
 * Generate soil management recommendations
 */
function generateRecommendations(
  pH: number | null,
  organicCarbon: number | null,
  nitrogen: number | null,
  clay: number | null,
  sand: number | null,
  drainage: string
): string[] {
  const recommendations: string[] = [];

  if (pH !== null && pH < 5.5) {
    recommendations.push('Apply agricultural lime (2-4 tonnes/hectare) to raise soil pH');
  }
  if (pH !== null && pH > 8.0) {
    recommendations.push('Apply gypsum (1-2 tonnes/hectare) to reduce soil alkalinity');
  }

  if (organicCarbon !== null && organicCarbon < 1.0) {
    recommendations.push('Add farmyard manure (FYM) at 10-15 tonnes/hectare to improve organic matter');
    recommendations.push('Practice green manuring with dhaincha or sunhemp before main crop');
  }

  if (nitrogen !== null && nitrogen < 0.1) {
    recommendations.push('Apply nitrogen fertilizer in split doses (urea or ammonium sulphate)');
    recommendations.push('Include leguminous crops in rotation for natural nitrogen fixation');
  }

  if (clay !== null && clay > 40) {
    recommendations.push('Add sand or organic matter to improve soil workability');
    recommendations.push('Use raised bed planting to improve drainage');
  }

  if (sand !== null && sand > 70) {
    recommendations.push('Add clay-rich soil or organic matter to improve water retention');
    recommendations.push('Use mulching to reduce water evaporation');
  }

  if (drainage === 'Poorly drained') {
    recommendations.push('Install drainage channels or use raised bed cultivation');
  }

  if (recommendations.length === 0) {
    recommendations.push('Soil conditions appear favorable - maintain current management practices');
    recommendations.push('Regular soil testing every 2-3 years recommended');
  }

  return recommendations;
}

/**
 * Perform comprehensive soil analysis for a given location
 */
export async function analyzeSoil(lat: number, lng: number): Promise<SoilAnalysisResult> {
  logger.info(`Starting soil analysis for ${lat}, ${lng}`);
  const startTime = Date.now();

  const dataSources: string[] = [];
  let status: SoilAnalysisResult['status'] = 'success';

  // Fetch data from both sources in parallel
  const [soilGridsData, openLandMapData] = await Promise.allSettled([
    fetchSoilGridsData(lat, lng),
    fetchOpenLandMapData(lat, lng),
  ]);

  // Extract SoilGrids properties
  let pH: number | null = null;
  let organicCarbon: number | null = null;
  let nitrogen: number | null = null;
  let clay: number | null = null;
  let sand: number | null = null;
  let silt: number | null = null;
  let cec: number | null = null;
  let bulkDensity: number | null = null;
  let waterContent: number | null = null;

  if (soilGridsData.status === 'fulfilled' && soilGridsData.value) {
    const data = soilGridsData.value;
    pH = extractPropertyValue(data, 'phh2o', '0-5cm');
    if (pH !== null) pH = pH / 10; // SoilGrids returns pH * 10
    organicCarbon = extractPropertyValue(data, 'soc', '0-5cm');
    if (organicCarbon !== null) organicCarbon = organicCarbon / 10; // dg/kg to g/kg
    nitrogen = extractPropertyValue(data, 'nitrogen', '0-5cm');
    if (nitrogen !== null) nitrogen = nitrogen / 100; // cg/kg to g/kg
    clay = extractPropertyValue(data, 'clay', '0-5cm');
    if (clay !== null) clay = clay / 10; // g/kg to %
    sand = extractPropertyValue(data, 'sand', '0-5cm');
    if (sand !== null) sand = sand / 10;
    silt = extractPropertyValue(data, 'silt', '0-5cm');
    if (silt !== null) silt = silt / 10;
    cec = extractPropertyValue(data, 'cec', '0-5cm');
    if (cec !== null) cec = cec / 10; // mmol(c)/kg to cmol/kg
    bulkDensity = extractPropertyValue(data, 'bdod', '0-5cm');
    if (bulkDensity !== null) bulkDensity = bulkDensity / 100; // cg/cm3 to g/cm3
    waterContent = extractPropertyValue(data, 'ocd', '0-5cm');

    dataSources.push('ISRIC SoilGrids v2.0');
  } else {
    logger.warn('SoilGrids data unavailable, proceeding with partial data');
    status = 'partial';
  }

  // Extract OpenLandMap data
  let soilTypeFromOLM: string | null = null;
  if (openLandMapData.status === 'fulfilled' && openLandMapData.value) {
    soilTypeFromOLM = openLandMapData.value.soilType;
    dataSources.push('OpenLandMap');
  } else {
    logger.warn('OpenLandMap data unavailable');
    if (status !== 'partial') status = 'partial';
  }

  // Derive computed properties
  const soilTexture = determineSoilTexture(clay, sand, silt);
  const drainageClass = determineDrainageClass(clay, sand);
  const fertilitySummary = generateFertilitySummary(pH, organicCarbon, nitrogen, cec, soilTexture);
  const cropSuitability = assessCropSuitability(pH, organicCarbon, clay, sand, soilTexture, drainageClass);
  const recommendations = generateRecommendations(pH, organicCarbon, nitrogen, clay, sand, drainageClass);

  if (dataSources.length === 0) {
    status = 'error';
  }

  const elapsed = Date.now() - startTime;
  logger.info(`Soil analysis completed in ${elapsed}ms with status: ${status}`);

  const makePropValue = (
    value: number | null,
    unit: string,
    depth: string,
    propName: string
  ): SoilPropertyValue | null => {
    if (value === null) return null;
    return {
      value,
      unit,
      depth,
      rating: rateSoilProperty(propName, value),
    };
  };

  return {
    status,
    location: { latitude: lat, longitude: lng },
    soilProperties: {
      pH: makePropValue(pH, 'pH units', '0-5cm', 'pH'),
      organicCarbon: makePropValue(organicCarbon, 'g/kg', '0-5cm', 'organicCarbon'),
      nitrogen: makePropValue(nitrogen, 'g/kg', '0-5cm', 'nitrogen'),
      clay: makePropValue(clay, '%', '0-5cm', 'clay'),
      sand: makePropValue(sand, '%', '0-5cm', 'sand'),
      silt: makePropValue(silt, '%', '0-5cm', 'silt'),
      cec: makePropValue(cec, 'cmol/kg', '0-5cm', 'cec'),
      bulkDensity: makePropValue(bulkDensity, 'g/cm3', '0-5cm', 'bulkDensity'),
      waterContent: makePropValue(waterContent, 'hg/m3', '0-5cm', 'waterContent'),
    },
    soilTexture: soilTypeFromOLM ? `${soilTexture} (${soilTypeFromOLM})` : soilTexture,
    drainageClass,
    fertilitySummary,
    cropSuitability,
    recommendations,
    dataSources,
    timestamp: new Date().toISOString(),
  };
}
