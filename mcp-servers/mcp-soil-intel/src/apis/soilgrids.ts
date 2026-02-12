import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { CacheManager } from '../utils/cache.js';
import { retry } from '../utils/retry.js';
import type { SoilGridsResponse } from '../types.js';

const logger = new Logger('SoilGridsAPI');
const cache = new CacheManager(30 * 24 * 60 * 60 * 1000); // 30 days

const SOILGRIDS_BASE_URL = 'https://rest.isric.org/soilgrids/v2.0';

/**
 * SoilGrids properties to fetch:
 * - phh2o: soil pH in water
 * - soc: soil organic carbon
 * - nitrogen: total nitrogen
 * - clay: clay content
 * - sand: sand content
 * - silt: silt content
 * - cec: cation exchange capacity
 * - bdod: bulk density
 * - ocd: organic carbon density
 */
const SOIL_PROPERTIES = ['phh2o', 'soc', 'nitrogen', 'clay', 'sand', 'silt', 'cec', 'bdod', 'ocd'];
const DEPTHS = ['0-5cm', '5-15cm', '15-30cm', '30-60cm'];

/**
 * Fetch soil properties from ISRIC SoilGrids API
 * @param lat Latitude (-90 to 90)
 * @param lng Longitude (-180 to 180)
 * @returns Parsed soil properties for the location
 */
export async function fetchSoilGridsData(lat: number, lng: number): Promise<SoilGridsResponse | null> {
  const cacheKey = CacheManager.coordKey(lat, lng, 'soilgrids');
  const cached = cache.get<SoilGridsResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for SoilGrids at ${lat}, ${lng}`);
    return cached;
  }

  logger.info(`Fetching SoilGrids data for ${lat}, ${lng}`);

  try {
    const response = await retry(async () => {
      const res = await axios.get(`${SOILGRIDS_BASE_URL}/properties/query`, {
        params: {
          lon: lng,
          lat: lat,
          property: SOIL_PROPERTIES,
          depth: DEPTHS,
          value: 'mean',
        },
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
        },
      });
      return res.data as SoilGridsResponse;
    }, { maxAttempts: 3, delayMs: 2000 });

    cache.set(cacheKey, response);
    logger.info(`SoilGrids data fetched successfully for ${lat}, ${lng}`);
    return response;
  } catch (error) {
    logger.error('Failed to fetch SoilGrids data', error);
    return null;
  }
}

/**
 * Extract a specific soil property value from SoilGrids response
 */
export function extractPropertyValue(
  data: SoilGridsResponse,
  propertyName: string,
  depthLabel: string = '0-5cm'
): number | null {
  if (!data?.properties?.layers) return null;

  const layer = data.properties.layers.find(l => l.name === propertyName);
  if (!layer) return null;

  const depth = layer.depths.find(d => d.label === depthLabel);
  if (!depth) return null;

  const rawValue = depth.values.mean;
  if (rawValue === null || rawValue === undefined) return null;

  // Apply conversion factor
  return rawValue * layer.unit_measure.conversion_factor;
}
