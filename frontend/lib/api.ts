// lib/api.ts - API integration with the orchestrator backend

import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Type definitions
export interface FarmerInput {
  location: {
    coordinates?: {
      lat: number;
      lon: number;
    };
    address?: string;
  };
  landSize: number;
  waterSource: string;
  previousCrops: string[];
  budget?: number;
  notes?: string;
  visualAssessmentId?: string; // Optional visual assessment ID from image analysis
}

export interface AgentStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  message: string;
  result?: any;
}

export interface FarmingPlan {
  sessionId: string;
  status: 'processing' | 'completed' | 'error';
  agentStatuses: AgentStatus[];
  synthesis?: {
    recommendedCrop: {
      name: string;
      variety: string;
      profitEstimate: number;
      costEstimate: number;
    };
    sowingDetails: {
      sowingDate: string;
      spacing: string;
      seedRate: string;
      soilPreparation: string;
    };
    waterManagement: {
      irrigationSchedule: string;
      waterRequirement: string;
      recommendations: string[];
    };
    sellingStrategy: {
      bestSellingTime: string;
      expectedPrice: number;
      nearbyMandis: Array<{
        name: string;
        distance: number;
        currentPrice: number;
        coordinates: { lat: number; lon: number };
      }>;
    };
    governmentSchemes: Array<{
      name: string;
      description: string;
      eligibility: string;
      benefit: string;
      applicationLink?: string;
    }>;
    riskWarnings: Array<{
      risk: string;
      severity: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    actionPlan: Array<{
      month: string;
      activities: string[];
    }>;
  };
  error?: string;
}

export interface MandiLocation {
  id: string;
  name: string;
  district: string;
  state: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  distance?: number;
  currentPrices?: Array<{
    commodity: string;
    price: number;
    unit: string;
    date: string;
  }>;
}

// Visual Assessment types
export interface VisualAssessmentResult {
  id: string;
  sessionId: string;
  soilAnalysis?: {
    soilType: string;
    color: string;
    texture: string;
    moisture: string;
    healthScore: number;
    recommendations: string[];
  };
  cropAnalysis?: {
    cropType: string;
    healthStatus: string;
    diseases: string[];
    pests: string[];
    recommendations: string[];
  };
  fieldAnalysis?: {
    fieldCondition: string;
    irrigationStatus: string;
    recommendations: string[];
  };
  confidence: number;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
}

// API client with error handling
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 300000, // 5 minutes - synthesis with extended thinking takes ~3 minutes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Error in request setup
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Submit farmer input and start analysis
 * @returns sessionId for tracking progress
 */
export async function submitFarmerInput(
  input: FarmerInput
): Promise<{ sessionId: string }> {
  try {
    const response = await apiClient.post<{ sessionId: string }>(
      '/api/farming-plan',
      input
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to submit farmer input');
  }
}

/**
 * Get farming plan status and results
 * Polls for updates on agent progress
 */
export async function getFarmingPlan(sessionId: string): Promise<FarmingPlan> {
  try {
    const response = await apiClient.get<FarmingPlan>(
      `/api/farming-plan/${sessionId}`
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to get farming plan');
  }
}

/**
 * Get nearby mandis (market locations)
 */
export async function getNearbyMandis(
  latitude: number,
  longitude: number,
  radius: number = 50
): Promise<MandiLocation[]> {
  try {
    const response = await apiClient.get<MandiLocation[]>('/api/mandis', {
      params: { lat: latitude, lon: longitude, radius },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get nearby mandis:', error);
    // Return mock data if API fails
    return getMockMandis(latitude, longitude);
  }
}

/**
 * Get current crop prices at a specific mandi
 */
export async function getMandiPrices(
  mandiId: string,
  commodity?: string
): Promise<any> {
  try {
    const response = await apiClient.get(`/api/mandis/${mandiId}/prices`, {
      params: { commodity },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get mandi prices');
  }
}

/**
 * Download farming plan as PDF
 */
export async function downloadFarmingPlanPDF(
  sessionId: string
): Promise<Blob> {
  try {
    const response = await apiClient.get(
      `/api/farming-plan/${sessionId}/pdf`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to download PDF');
  }
}

/**
 * Share farming plan via WhatsApp or other channels
 */
export function shareFarmingPlan(sessionId: string, text: string): void {
  const shareUrl = `${window.location.origin}/results/${sessionId}`;
  const shareText = `${text}\n\nView full plan: ${shareUrl}`;

  if (navigator.share) {
    navigator
      .share({
        title: 'My Farming Plan - KisanMind',
        text: shareText,
      })
      .catch((error) => console.error('Error sharing:', error));
  } else {
    // Fallback to WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  }
}

/**
 * Mock data for testing when API is unavailable
 */
function getMockMandis(lat: number, lon: number): MandiLocation[] {
  return [
    {
      id: '1',
      name: 'Akola Mandi',
      district: 'Akola',
      state: 'Maharashtra',
      coordinates: { lat: 20.7, lon: 77.0 },
      distance: 15.2,
      currentPrices: [
        { commodity: 'Cotton', price: 6500, unit: 'quintal', date: '2026-02-12' },
        { commodity: 'Soybean', price: 4800, unit: 'quintal', date: '2026-02-12' },
      ],
    },
    {
      id: '2',
      name: 'Amravati Mandi',
      district: 'Amravati',
      state: 'Maharashtra',
      coordinates: { lat: 20.93, lon: 77.75 },
      distance: 28.5,
      currentPrices: [
        { commodity: 'Cotton', price: 6600, unit: 'quintal', date: '2026-02-12' },
      ],
    },
  ];
}

/**
 * Mock farming plan for demo/testing
 */
export function getMockFarmingPlan(): FarmingPlan {
  return {
    sessionId: 'demo-session',
    status: 'completed',
    agentStatuses: [
      {
        name: 'Ground Analyzer',
        status: 'completed',
        progress: 100,
        message: 'Soil analysis complete',
      },
      {
        name: 'Water Assessor',
        status: 'completed',
        progress: 100,
        message: 'Water quality assessed',
      },
      {
        name: 'Climate Forecaster',
        status: 'completed',
        progress: 100,
        message: 'Climate forecast ready',
      },
      {
        name: 'Market Intel',
        status: 'completed',
        progress: 100,
        message: 'Market analysis complete',
      },
      {
        name: 'Scheme Finder',
        status: 'completed',
        progress: 100,
        message: 'Government schemes identified',
      },
    ],
    synthesis: {
      recommendedCrop: {
        name: 'Soybean',
        variety: 'JS 20-29',
        profitEstimate: 85000,
        costEstimate: 45000,
      },
      sowingDetails: {
        sowingDate: 'June 15 - July 10, 2026',
        spacing: '45 cm x 5 cm',
        seedRate: '75-80 kg/hectare',
        soilPreparation:
          'Deep ploughing followed by 2-3 harrowings. Apply FYM @ 5 tons/acre.',
      },
      waterManagement: {
        irrigationSchedule: '2-3 critical irrigations (flowering, pod formation)',
        waterRequirement: '450-650 mm total',
        recommendations: [
          'First irrigation at 30-35 days after sowing',
          'Second irrigation during flowering stage',
          'Third irrigation during pod development',
        ],
      },
      sellingStrategy: {
        bestSellingTime: 'November 2026',
        expectedPrice: 5200,
        nearbyMandis: [
          {
            name: 'Akola Mandi',
            distance: 15.2,
            currentPrice: 4800,
            coordinates: { lat: 20.7, lon: 77.0 },
          },
          {
            name: 'Amravati Mandi',
            distance: 28.5,
            currentPrice: 4900,
            coordinates: { lat: 20.93, lon: 77.75 },
          },
        ],
      },
      governmentSchemes: [
        {
          name: 'PM-KISAN',
          description: 'Direct income support of ₹6000/year',
          eligibility: 'All landholding farmer families',
          benefit: '₹6000 per year in 3 installments',
          applicationLink: 'https://pmkisan.gov.in/',
        },
        {
          name: 'PMFBY (Crop Insurance)',
          description: 'Comprehensive crop insurance',
          eligibility: 'All farmers growing notified crops',
          benefit: 'Premium subsidy + crop loss coverage',
          applicationLink: 'https://pmfby.gov.in/',
        },
      ],
      riskWarnings: [
        {
          risk: 'Irregular monsoon patterns',
          severity: 'medium',
          mitigation:
            'Install drip irrigation, mulch fields, and monitor weather forecasts regularly',
        },
        {
          risk: 'Yellow mosaic virus',
          severity: 'high',
          mitigation:
            'Use certified disease-resistant seeds, control whitefly population, spray recommended pesticides',
        },
        {
          risk: 'Market price volatility',
          severity: 'medium',
          mitigation:
            'Consider Minimum Support Price (MSP) procurement, store 30% harvest for better prices',
        },
      ],
      actionPlan: [
        {
          month: 'June 2026',
          activities: [
            'Complete land preparation and FYM application',
            'Purchase certified JS 20-29 seeds',
            'Apply for PM-KISAN if not enrolled',
            'Enroll in PMFBY crop insurance',
            'Sow seeds between June 15-July 10',
          ],
        },
        {
          month: 'July 2026',
          activities: [
            'Monitor germination (7-10 days)',
            'Apply first irrigation if rainfall is insufficient',
            'Weed management (15-20 days after sowing)',
            'Apply basal fertilizer (DAP)',
          ],
        },
        {
          month: 'August 2026',
          activities: [
            'Monitor for pests (pod borer, defoliators)',
            'Second irrigation during flowering',
            'Apply top dressing (Urea)',
            'Spray for yellow mosaic virus prevention',
          ],
        },
        {
          month: 'September 2026',
          activities: [
            'Third irrigation during pod development',
            'Monitor pod filling stage',
            'Scout fields for late-season pests',
          ],
        },
        {
          month: 'October 2026',
          activities: [
            'Stop irrigation 10-15 days before harvest',
            'Monitor crop maturity (leaves turn yellow)',
            'Prepare storage facilities',
            'Contact buyers/mandis for price quotes',
          ],
        },
        {
          month: 'November 2026',
          activities: [
            'Harvest when 95% pods turn brown',
            'Dry harvested crop to 10-12% moisture',
            'Sort and grade produce',
            'Sell at best mandi prices or MSP centers',
          ],
        },
      ],
    },
  };
}

/**
 * Get visual assessment by ID
 */
export async function getVisualAssessment(
  assessmentId: string
): Promise<VisualAssessmentResult> {
  try {
    const response = await apiClient.get<VisualAssessmentResult>(
      `/api/visual-assessment/${assessmentId}`
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to get visual assessment');
  }
}

/**
 * Get latest visual assessment for a session
 */
export async function getLatestVisualAssessment(
  sessionId: string
): Promise<VisualAssessmentResult | null> {
  try {
    const response = await apiClient.get<VisualAssessmentResult>(
      `/api/visual-assessment/session/${sessionId}/latest`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get latest visual assessment:', error);
    return null;
  }
}
