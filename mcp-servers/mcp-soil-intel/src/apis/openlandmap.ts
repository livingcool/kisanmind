import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { CacheManager } from '../utils/cache.js';
import { retry } from '../utils/retry.js';

const logger = new Logger('OpenLandMapAPI');
const cache = new CacheManager(30 * 24 * 60 * 60 * 1000); // 30 days

const OPENLANDMAP_BASE_URL = 'https://api.openlandmap.org';

export interface OpenLandMapSoilData {
  soilType: string | null;
  soilTexture: string | null;
  waterRetention: number | null;
  drainageClass: string | null;
}

/**
 * Fetch additional soil data from OpenLandMap
 * Supplements SoilGrids with classification data
 */
export async function fetchOpenLandMapData(lat: number, lng: number): Promise<OpenLandMapSoilData> {
  const cacheKey = CacheManager.coordKey(lat, lng, 'openlandmap');
  const cached = cache.get<OpenLandMapSoilData>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for OpenLandMap at ${lat}, ${lng}`);
    return cached;
  }

  logger.info(`Fetching OpenLandMap data for ${lat}, ${lng}`);

  const result: OpenLandMapSoilData = {
    soilType: null,
    soilTexture: null,
    waterRetention: null,
    drainageClass: null,
  };

  try {
    // Fetch soil type classification (USDA taxonomy)
    const soilTypeResponse = await retry(async () => {
      const res = await axios.get(`${OPENLANDMAP_BASE_URL}/query/point`, {
        params: {
          lon: lng,
          lat: lat,
          coll: 'predicted250m',
          regex: 'sol_grtgroup_usda.soiltax',
        },
        timeout: 15000,
      });
      return res.data;
    }, { maxAttempts: 2, delayMs: 1000 });

    if (soilTypeResponse && typeof soilTypeResponse === 'object') {
      const firstKey = Object.keys(soilTypeResponse).find(k => k.includes('sol_grtgroup'));
      if (firstKey) {
        result.soilType = classifySoilType(soilTypeResponse[firstKey]);
      }
    }
  } catch (error) {
    logger.warn('Failed to fetch OpenLandMap soil type', error);
  }

  cache.set(cacheKey, result);
  return result;
}

/**
 * Classify USDA soil great group code to human-readable name
 */
function classifySoilType(code: number | string): string {
  const soilGroups: Record<string, string> = {
    '1': 'Alfisols (Fertile, good for agriculture)',
    '2': 'Andisols (Volcanic, high water retention)',
    '3': 'Aridisols (Dry, needs irrigation)',
    '4': 'Entisols (Young, variable fertility)',
    '5': 'Gelisols (Frozen, limited agriculture)',
    '6': 'Histosols (Organic, good for specific crops)',
    '7': 'Inceptisols (Developing, moderate fertility)',
    '8': 'Mollisols (Highly fertile prairie soils)',
    '9': 'Oxisols (Weathered tropical, needs amendments)',
    '10': 'Spodosols (Acidic, needs lime)',
    '11': 'Ultisols (Acidic, low fertility)',
    '12': 'Vertisols (Clay-rich, shrink-swell)',
  };

  const codeStr = String(code);
  return soilGroups[codeStr] || `Unknown soil type (code: ${codeStr})`;
}
