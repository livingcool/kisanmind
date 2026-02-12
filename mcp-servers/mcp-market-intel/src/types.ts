/**
 * Type definitions for the Market Intelligence MCP server
 */

export interface MarketAnalysisResult {
  status: 'success' | 'partial' | 'error';
  location: {
    latitude: number;
    longitude: number;
    state: string;
    district: string;
  };
  cropPrices: CropPriceInfo[];
  nearbyMandis: MandiInfo[];
  marketTrends: MarketTrend[];
  profitEstimates: ProfitEstimate[];
  recommendations: string[];
  dataSources: string[];
  timestamp: string;
}

export interface CropPriceInfo {
  crop: string;
  variety: string;
  currentPrice: number;
  msp: number | null;
  unit: string;
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated: string;
}

export interface MandiInfo {
  name: string;
  district: string;
  state: string;
  distance_km: number | null;
  latitude: number;
  longitude: number;
  majorCrops: string[];
}

export interface MarketTrend {
  crop: string;
  shortTermOutlook: string;
  seasonalPattern: string;
  bestSellingMonth: string;
  riskFactors: string[];
}

export interface ProfitEstimate {
  crop: string;
  expectedYield_quintal_per_acre: number;
  expectedPrice_per_quintal: number;
  estimatedCost_per_acre: number;
  estimatedRevenue_per_acre: number;
  estimatedProfit_per_acre: number;
  profitMargin_percent: number;
  riskLevel: 'low' | 'moderate' | 'high';
  notes: string;
}

export interface FarmerLocation {
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
}
