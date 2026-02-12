/**
 * NASA POWER API integration for long-term climate data
 * Provides temperature climatology and solar radiation data
 */
import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { CacheManager } from '../utils/cache.js';
import { retry } from '../utils/retry.js';

const logger = new Logger('NASAPowerClimateAPI');
const cache = new CacheManager(30 * 24 * 60 * 60 * 1000); // 30 days

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface ClimateNormals {
  monthlyTempMax: { month: string; tempC: number }[];
  monthlyTempMin: { month: string; tempC: number }[];
  monthlyRainfall: { month: string; mm: number }[];
  annualSolarRadiation: number | null;
  growingDegreeDays: number | null;
}

/**
 * Fetch climate normals from NASA POWER (10-year average)
 */
export async function fetchClimateNormals(lat: number, lng: number): Promise<ClimateNormals> {
  const cacheKey = CacheManager.coordKey(lat, lng, 'climate-normals');
  const cached = cache.get<ClimateNormals>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for climate normals at ${lat}, ${lng}`);
    return cached;
  }

  logger.info(`Fetching climate normals for ${lat}, ${lng}`);

  const result: ClimateNormals = {
    monthlyTempMax: [],
    monthlyTempMin: [],
    monthlyRainfall: [],
    annualSolarRadiation: null,
    growingDegreeDays: null,
  };

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 10;
  const endYear = currentYear - 1;

  try {
    const response = await retry(async () => {
      const res = await axios.get('https://power.larc.nasa.gov/api/temporal/monthly/point', {
        params: {
          parameters: 'T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN',
          community: 'AG',
          longitude: lng,
          latitude: lat,
          start: startYear,
          end: endYear,
          format: 'JSON',
        },
        timeout: 30000,
      });
      return res.data;
    }, { maxAttempts: 3, delayMs: 2000 });

    const params = response?.properties?.parameter;
    if (!params) return result;

    // Compute monthly averages over the 10-year period
    for (let m = 1; m <= 12; m++) {
      const monthKey = String(m).padStart(2, '0');
      const maxTemps: number[] = [];
      const minTemps: number[] = [];
      const rainfalls: number[] = [];

      for (let y = startYear; y <= endYear; y++) {
        const key = `${y}${monthKey}`;
        if (params.T2M_MAX?.[key] !== undefined && params.T2M_MAX[key] !== -999) {
          maxTemps.push(params.T2M_MAX[key]);
        }
        if (params.T2M_MIN?.[key] !== undefined && params.T2M_MIN[key] !== -999) {
          minTemps.push(params.T2M_MIN[key]);
        }
        if (params.PRECTOTCORR?.[key] !== undefined && params.PRECTOTCORR[key] !== -999) {
          rainfalls.push(params.PRECTOTCORR[key]);
        }
      }

      const avgMax = maxTemps.length > 0 ? maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length : 30;
      const avgMin = minTemps.length > 0 ? minTemps.reduce((a, b) => a + b, 0) / minTemps.length : 20;
      const avgRain = rainfalls.length > 0 ? rainfalls.reduce((a, b) => a + b, 0) / rainfalls.length : 0;

      result.monthlyTempMax.push({ month: MONTHS[m - 1], tempC: Math.round(avgMax * 10) / 10 });
      result.monthlyTempMin.push({ month: MONTHS[m - 1], tempC: Math.round(avgMin * 10) / 10 });
      result.monthlyRainfall.push({ month: MONTHS[m - 1], mm: Math.round(avgRain * 10) / 10 });
    }

    // Calculate Growing Degree Days (base 10C)
    let gdd = 0;
    for (let m = 0; m < 12; m++) {
      const avgTemp = (result.monthlyTempMax[m].tempC + result.monthlyTempMin[m].tempC) / 2;
      const monthGDD = Math.max(0, avgTemp - 10) * 30; // 30 days per month approx
      gdd += monthGDD;
    }
    result.growingDegreeDays = Math.round(gdd);

    // Annual solar radiation
    const solar = params.ALLSKY_SFC_SW_DWN;
    if (solar) {
      const solarValues: number[] = [];
      for (const key of Object.keys(solar)) {
        if (solar[key] !== -999 && !key.includes('13')) {
          solarValues.push(solar[key]);
        }
      }
      result.annualSolarRadiation = solarValues.length > 0
        ? Math.round((solarValues.reduce((a, b) => a + b, 0) / solarValues.length) * 10) / 10
        : null;
    }

    cache.set(cacheKey, result);
    logger.info(`Climate normals fetched for ${lat}, ${lng}`);
  } catch (error) {
    logger.error('Failed to fetch climate normals', error);
  }

  return result;
}
