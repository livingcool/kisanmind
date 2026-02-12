/**
 * NASA POWER API integration for precipitation and evapotranspiration data
 * API: https://power.larc.nasa.gov/
 * No API key required, ~300 requests/hour
 */
import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { CacheManager } from '../utils/cache.js';
import { retry } from '../utils/retry.js';
import type { MonthlyRainfall } from '../types.js';

const logger = new Logger('NASAPowerAPI');
const cache = new CacheManager(7 * 24 * 60 * 60 * 1000); // 7 days

const NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/monthly/point';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface NASAPowerResult {
  annualRainfall: number | null;
  monthlyRainfall: MonthlyRainfall[];
  annualEvapotranspiration: number | null;
  monthlyTemp: { month: string; tempC: number }[];
}

/**
 * Fetch precipitation and climate data from NASA POWER
 */
export async function fetchNASAPowerData(lat: number, lng: number): Promise<NASAPowerResult> {
  const cacheKey = CacheManager.coordKey(lat, lng, 'nasa-power');
  const cached = cache.get<NASAPowerResult>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for NASA POWER at ${lat}, ${lng}`);
    return cached;
  }

  logger.info(`Fetching NASA POWER data for ${lat}, ${lng}`);

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;
  const endYear = currentYear - 1; // Use completed years

  try {
    const response = await retry(async () => {
      const res = await axios.get(NASA_POWER_BASE_URL, {
        params: {
          parameters: 'PRECTOTCORR,T2M,EVPTRNS',
          community: 'AG',
          longitude: lng,
          latitude: lat,
          start: startYear,
          end: endYear,
          format: 'JSON',
        },
        timeout: 30000,
        headers: { 'Accept': 'application/json' },
      });
      return res.data;
    }, { maxAttempts: 3, delayMs: 2000 });

    const params = response?.properties?.parameter;
    if (!params) {
      logger.warn('NASA POWER returned no parameter data');
      return emptyResult();
    }

    // Calculate average monthly rainfall over the period
    const precip = params.PRECTOTCORR;
    const temp = params.T2M;

    const monthlyRainfall: MonthlyRainfall[] = [];
    const monthlyTemp: { month: string; tempC: number }[] = [];
    let annualTotal = 0;

    for (let m = 1; m <= 12; m++) {
      const monthKey = String(m).padStart(2, '0');
      const values: number[] = [];
      const tempValues: number[] = [];

      for (let y = startYear; y <= endYear; y++) {
        const key = `${y}${monthKey}`;
        if (precip?.[key] !== undefined && precip[key] !== -999) {
          values.push(precip[key]);
        }
        if (temp?.[key] !== undefined && temp[key] !== -999) {
          tempValues.push(temp[key]);
        }
      }

      const avgRain = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const avgTemp = tempValues.length > 0 ? tempValues.reduce((a, b) => a + b, 0) / tempValues.length : 25;

      monthlyRainfall.push({
        month: MONTHS[m - 1],
        rainfall_mm: Math.round(avgRain * 10) / 10,
      });
      monthlyTemp.push({
        month: MONTHS[m - 1],
        tempC: Math.round(avgTemp * 10) / 10,
      });
      annualTotal += avgRain;
    }

    // Calculate annual evapotranspiration
    const evap = params.EVPTRNS;
    let annualET = 0;
    if (evap) {
      const etValues: number[] = [];
      for (const key of Object.keys(evap)) {
        if (evap[key] !== -999 && !key.includes('13')) {
          etValues.push(evap[key]);
        }
      }
      // Monthly values over years - sum monthly averages
      annualET = etValues.length > 0
        ? (etValues.reduce((a, b) => a + b, 0) / etValues.length) * 12
        : 0;
    }

    const result: NASAPowerResult = {
      annualRainfall: Math.round(annualTotal),
      monthlyRainfall,
      annualEvapotranspiration: Math.round(annualET),
      monthlyTemp,
    };

    cache.set(cacheKey, result);
    logger.info(`NASA POWER data fetched successfully for ${lat}, ${lng}`);
    return result;
  } catch (error) {
    logger.error('Failed to fetch NASA POWER data', error);
    return emptyResult();
  }
}

function emptyResult(): NASAPowerResult {
  return {
    annualRainfall: null,
    monthlyRainfall: [],
    annualEvapotranspiration: null,
    monthlyTemp: [],
  };
}
