/**
 * Type definitions for the Water Intelligence MCP server
 */

export interface WaterAnalysisResult {
  status: 'success' | 'partial' | 'error';
  location: {
    latitude: number;
    longitude: number;
  };
  rainfall: {
    annualAverage: number | null;
    monthlyDistribution: MonthlyRainfall[];
    monsoonReliability: string;
    droughtRisk: 'low' | 'moderate' | 'high' | 'very_high' | null;
  };
  groundwater: {
    depthToWaterTable: number | null;
    depletionTrend: string | null;
    quality: string | null;
    rechargeRate: string | null;
  };
  irrigationAssessment: {
    waterAvailability: 'abundant' | 'adequate' | 'limited' | 'scarce' | null;
    recommendedMethod: string;
    waterBudget: string;
  };
  cropWaterRequirements: CropWaterNeed[];
  recommendations: string[];
  dataSources: string[];
  timestamp: string;
}

export interface MonthlyRainfall {
  month: string;
  rainfall_mm: number;
}

export interface CropWaterNeed {
  crop: string;
  waterRequirement_mm: number;
  irrigationNeeded: boolean;
  feasibility: 'highly_feasible' | 'feasible' | 'marginal' | 'not_feasible';
  notes: string;
}

export interface NASAPowerResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
  properties: {
    parameter: Record<string, Record<string, number>>;
  };
  header: {
    title: string;
  };
}

export interface OpenMeteoHistoricalResponse {
  daily: {
    time: string[];
    precipitation_sum: number[];
    et0_fao_evapotranspiration: number[];
  };
}

export interface FarmerLocation {
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
}
