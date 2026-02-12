/**
 * Open-Meteo API integration for recent weather and forecast data
 * API: https://open-meteo.com/
 * Free, no API key, 10,000 requests/day
 */
import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { CacheManager } from '../utils/cache.js';
import { retry } from '../utils/retry.js';

const logger = new Logger('OpenMeteoAPI');
const cache = new CacheManager(6 * 60 * 60 * 1000); // 6 hours for weather data

export interface OpenMeteoResult {
  recentRainfall_mm: number;
  forecastRainfall_mm: number;
  soilMoisture: number | null;
  currentTemp: number | null;
  humidity: number | null;
}

/**
 * Fetch recent and forecast weather data from Open-Meteo
 */
export async function fetchOpenMeteoData(lat: number, lng: number): Promise<OpenMeteoResult> {
  const cacheKey = CacheManager.coordKey(lat, lng, 'open-meteo');
  const cached = cache.get<OpenMeteoResult>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for Open-Meteo at ${lat}, ${lng}`);
    return cached;
  }

  logger.info(`Fetching Open-Meteo data for ${lat}, ${lng}`);

  const result: OpenMeteoResult = {
    recentRainfall_mm: 0,
    forecastRainfall_mm: 0,
    soilMoisture: null,
    currentTemp: null,
    humidity: null,
  };

  try {
    // Fetch 16-day forecast
    const forecastResponse = await retry(async () => {
      const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration',
          current: 'temperature_2m,relative_humidity_2m,soil_moisture_0_to_1cm',
          forecast_days: 16,
          timezone: 'auto',
        },
        timeout: 15000,
      });
      return res.data;
    }, { maxAttempts: 2, delayMs: 1000 });

    if (forecastResponse) {
      // Current conditions
      if (forecastResponse.current) {
        result.currentTemp = forecastResponse.current.temperature_2m ?? null;
        result.humidity = forecastResponse.current.relative_humidity_2m ?? null;
        result.soilMoisture = forecastResponse.current.soil_moisture_0_to_1cm ?? null;
      }

      // Forecast rainfall sum
      if (forecastResponse.daily?.precipitation_sum) {
        result.forecastRainfall_mm = forecastResponse.daily.precipitation_sum
          .reduce((sum: number, val: number) => sum + (val || 0), 0);
      }
    }

    // Fetch past 30 days historical data
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = now.toISOString().split('T')[0];
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const historicalResponse = await retry(async () => {
      const res = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
          latitude: lat,
          longitude: lng,
          start_date: startDate,
          end_date: endDate,
          daily: 'precipitation_sum',
          timezone: 'auto',
        },
        timeout: 15000,
      });
      return res.data;
    }, { maxAttempts: 2, delayMs: 1000 });

    if (historicalResponse?.daily?.precipitation_sum) {
      result.recentRainfall_mm = historicalResponse.daily.precipitation_sum
        .reduce((sum: number, val: number) => sum + (val || 0), 0);
    }
  } catch (error) {
    logger.error('Failed to fetch Open-Meteo data', error);
  }

  cache.set(cacheKey, result);
  return result;
}
