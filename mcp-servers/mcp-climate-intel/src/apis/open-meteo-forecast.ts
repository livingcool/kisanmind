/**
 * Open-Meteo Forecast API integration
 * Provides 16-day weather forecasts and historical climate data
 */
import axios from 'axios';
import { Logger } from '../utils/logger.js';
import { CacheManager } from '../utils/cache.js';
import { retry } from '../utils/retry.js';
import type { DailyForecast } from '../types.js';

const logger = new Logger('OpenMeteoForecastAPI');
const cache = new CacheManager(3 * 60 * 60 * 1000); // 3 hours

export interface ForecastResult {
  currentTemp: number | null;
  currentHumidity: number | null;
  currentWindSpeed: number | null;
  currentCondition: string | null;
  dailyForecasts: DailyForecast[];
}

/**
 * Map WMO weather codes to human-readable descriptions
 */
function weatherCodeToCondition(code: number): string {
  const codes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snowfall', 73: 'Moderate snowfall', 75: 'Heavy snowfall',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };
  return codes[code] || 'Unknown';
}

/**
 * Fetch 16-day forecast from Open-Meteo
 */
export async function fetchForecast(lat: number, lng: number): Promise<ForecastResult> {
  const cacheKey = CacheManager.coordKey(lat, lng, 'forecast');
  const cached = cache.get<ForecastResult>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for forecast at ${lat}, ${lng}`);
    return cached;
  }

  logger.info(`Fetching forecast for ${lat}, ${lng}`);

  const result: ForecastResult = {
    currentTemp: null,
    currentHumidity: null,
    currentWindSpeed: null,
    currentCondition: null,
    dailyForecasts: [],
  };

  try {
    const response = await retry(async () => {
      const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,weather_code',
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
          forecast_days: 16,
          timezone: 'auto',
        },
        timeout: 15000,
      });
      return res.data;
    }, { maxAttempts: 2, delayMs: 1000 });

    if (response?.current) {
      result.currentTemp = response.current.temperature_2m ?? null;
      result.currentHumidity = response.current.relative_humidity_2m ?? null;
      result.currentWindSpeed = response.current.wind_speed_10m ?? null;
      result.currentCondition = response.current.weather_code !== undefined
        ? weatherCodeToCondition(response.current.weather_code)
        : null;
    }

    if (response?.daily) {
      const d = response.daily;
      const days = d.time?.length || 0;
      for (let i = 0; i < days; i++) {
        result.dailyForecasts.push({
          date: d.time[i],
          tempMax: d.temperature_2m_max?.[i] ?? 0,
          tempMin: d.temperature_2m_min?.[i] ?? 0,
          precipitation_mm: d.precipitation_sum?.[i] ?? 0,
          humidity: d.relative_humidity_2m_mean?.[i] ?? 0,
          windSpeed: d.wind_speed_10m_max?.[i] ?? 0,
          condition: d.weather_code?.[i] !== undefined
            ? weatherCodeToCondition(d.weather_code[i])
            : 'Unknown',
        });
      }
    }

    cache.set(cacheKey, result);
    logger.info(`Forecast fetched successfully for ${lat}, ${lng}`);
  } catch (error) {
    logger.error('Failed to fetch forecast', error);
  }

  return result;
}
