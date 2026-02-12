/**
 * Type definitions for the Government Scheme Intelligence MCP server
 */

export interface SchemeAnalysisResult {
  status: 'success' | 'partial' | 'error';
  location: {
    latitude: number;
    longitude: number;
    state: string;
  };
  eligibleSchemes: GovernmentScheme[];
  insuranceSchemes: InsuranceScheme[];
  subsidies: SubsidyInfo[];
  creditFacilities: CreditFacility[];
  applicationTimeline: ApplicationStep[];
  totalPotentialBenefit: string;
  recommendations: string[];
  dataSources: string[];
  timestamp: string;
}

export interface GovernmentScheme {
  name: string;
  category: 'income_support' | 'insurance' | 'subsidy' | 'credit' | 'irrigation' | 'marketing' | 'training';
  description: string;
  benefit: string;
  eligibility: string[];
  howToApply: string;
  deadline: string | null;
  website: string;
  annualBenefit_INR: number | null;
}

export interface InsuranceScheme {
  name: string;
  description: string;
  premium: string;
  coverage: string;
  crops: string[];
  enrollmentDeadline: string;
  claimProcess: string;
}

export interface SubsidyInfo {
  name: string;
  subsidy_percent: number;
  maxAmount_INR: number;
  forWhat: string;
  eligibility: string;
  howToApply: string;
}

export interface CreditFacility {
  name: string;
  provider: string;
  interestRate: string;
  maxAmount: string;
  purpose: string;
  eligibility: string;
}

export interface ApplicationStep {
  step: number;
  scheme: string;
  action: string;
  where: string;
  deadline: string;
  documents: string[];
}

export interface FarmerProfile {
  latitude: number;
  longitude: number;
  state?: string;
  landSize_acres?: number;
  crops?: string[];
  waterSource?: string;
  category?: 'small' | 'marginal' | 'medium' | 'large';
}
