/**
 * Type definitions for the Climate Intelligence MCP server
 */

export interface ClimateAnalysisResult {
  status: 'success' | 'partial' | 'error';
  location: {
    latitude: number;
    longitude: number;
  };
  currentWeather: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    condition: string | null;
  };
  forecast: DailyForecast[];
  seasonalOutlook: {
    currentSeason: string;
    temperatureTrend: string;
    rainfallTrend: string;
    advisories: string[];
  };
  climateRisks: ClimateRisk[];
  growingConditions: {
    growingDegreeDays: number | null;
    frostRisk: 'none' | 'low' | 'moderate' | 'high' | null;
    heatStressRisk: 'none' | 'low' | 'moderate' | 'high' | null;
    optimalPlantingWindow: string;
  };
  cropClimateMatch: CropClimateSuitability[];
  recommendations: string[];
  dataSources: string[];
  timestamp: string;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation_mm: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}

export interface ClimateRisk {
  risk: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  probability: string;
  impact: string;
  mitigation: string;
}

export interface CropClimateSuitability {
  crop: string;
  temperatureFit: 'optimal' | 'acceptable' | 'marginal' | 'unsuitable';
  climateFit: string;
  bestSeason: string;
  notes: string;
}

export interface FarmerLocation {
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
}
