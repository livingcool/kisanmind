/**
 * Type definitions for the Soil Intelligence MCP server
 */

export interface SoilGridsResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    layers: SoilGridsLayer[];
  };
}

export interface SoilGridsLayer {
  name: string;
  unit_measure: {
    mapped_units: string;
    target_units: string;
    conversion_factor: number;
  };
  depths: SoilGridsDepth[];
}

export interface SoilGridsDepth {
  label: string;
  range: {
    top_depth: number;
    bottom_depth: number;
    unit_depth: string;
  };
  values: {
    mean: number;
    Q0_05: number;
    Q0_5: number;
    Q0_95: number;
    uncertainty: number;
  };
}

export interface SoilAnalysisResult {
  status: 'success' | 'partial' | 'error';
  location: {
    latitude: number;
    longitude: number;
  };
  soilProperties: {
    pH: SoilPropertyValue | null;
    organicCarbon: SoilPropertyValue | null;
    nitrogen: SoilPropertyValue | null;
    clay: SoilPropertyValue | null;
    sand: SoilPropertyValue | null;
    silt: SoilPropertyValue | null;
    cec: SoilPropertyValue | null;
    bulkDensity: SoilPropertyValue | null;
    waterContent: SoilPropertyValue | null;
  };
  soilTexture: string;
  drainageClass: string;
  fertilitySummary: string;
  cropSuitability: CropSuitability[];
  recommendations: string[];
  dataSources: string[];
  timestamp: string;
}

export interface SoilPropertyValue {
  value: number;
  unit: string;
  depth: string;
  rating: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
}

export interface CropSuitability {
  crop: string;
  suitability: 'highly_suitable' | 'suitable' | 'moderately_suitable' | 'marginally_suitable' | 'not_suitable';
  reason: string;
}

export interface OpenLandMapResponse {
  value: number;
  unit: string;
}

export interface FarmerLocation {
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
}
