/**
 * Unit tests for water analyzer functionality
 * Tests water analysis logic, rainfall assessment, and irrigation recommendations
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { analyzeWater } from '../water-analyzer.js';
import * as nasaPowerApi from '../apis/nasa-power.js';
import * as openMeteoApi from '../apis/open-meteo.js';

// Mock the API modules
jest.mock('../apis/nasa-power.js');
jest.mock('../apis/open-meteo.js');

// Test coordinates for Vidarbha, Maharashtra
const VIDARBHA_LAT = 20.9;
const VIDARBHA_LNG = 77.75;

describe('Water Analyzer - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeWater', () => {
    it('should successfully analyze water with complete data from both APIs', async () => {
      // Arrange - Mock successful API responses
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 850,
        monthlyRainfall: [
          { month: 'Jan', rainfall_mm: 10 },
          { month: 'Feb', rainfall_mm: 8 },
          { month: 'Mar', rainfall_mm: 12 },
          { month: 'Apr', rainfall_mm: 20 },
          { month: 'May', rainfall_mm: 45 },
          { month: 'Jun', rainfall_mm: 180 },
          { month: 'Jul', rainfall_mm: 280 },
          { month: 'Aug', rainfall_mm: 220 },
          { month: 'Sep', rainfall_mm: 150 },
          { month: 'Oct', rainfall_mm: 80 },
          { month: 'Nov', rainfall_mm: 25 },
          { month: 'Dec', rainfall_mm: 12 },
        ],
        annualEvapotranspiration: 1200,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 45,
        forecastRainfall_mm: 85,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.status).toBe('success');
      expect(result.location.latitude).toBe(VIDARBHA_LAT);
      expect(result.location.longitude).toBe(VIDARBHA_LNG);
      expect(result.dataSources).toContain('NASA POWER (5-year climatology)');
      expect(result.dataSources).toContain('Open-Meteo (current & forecast)');
      expect(result.rainfall.annualAverage).toBe(850);
      expect(result.rainfall.monthlyDistribution.length).toBe(12);
      expect(result.cropWaterRequirements.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeTruthy();
    });

    it('should handle partial data when NASA POWER API fails', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: null,
        monthlyRainfall: [],
        annualEvapotranspiration: null,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 25,
        forecastRainfall_mm: 40,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.status).toBe('partial');
      expect(result.dataSources).toContain('Open-Meteo (current & forecast)');
    });

    it('should handle partial data when Open-Meteo API fails', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 800,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 200 }],
        annualEvapotranspiration: 1100,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.status).toBe('partial');
      expect(result.dataSources).toContain('NASA POWER (5-year climatology)');
    });

    it('should return error status when all APIs fail', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: null,
        monthlyRainfall: [],
        annualEvapotranspiration: null,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.status).toBe('error');
      expect(result.dataSources.length).toBe(0);
    });
  });

  describe('Drought Risk Assessment', () => {
    it('should classify very high drought risk for rainfall < 250mm', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 200,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 200 }],
        annualEvapotranspiration: 1500,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 0,
        forecastRainfall_mm: 5,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.rainfall.droughtRisk).toBe('very_high');
    });

    it('should classify high drought risk for rainfall 250-500mm', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 400,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 400 }],
        annualEvapotranspiration: 1200,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 10,
        forecastRainfall_mm: 15,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.rainfall.droughtRisk).toBe('high');
    });

    it('should classify moderate drought risk for rainfall 500-750mm', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 650,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 650 }],
        annualEvapotranspiration: 1100,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 30,
        forecastRainfall_mm: 40,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.rainfall.droughtRisk).toBe('moderate');
    });

    it('should classify low drought risk for rainfall > 750mm', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 1200,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 1200 }],
        annualEvapotranspiration: 900,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 60,
        forecastRainfall_mm: 80,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.rainfall.droughtRisk).toBe('low');
    });
  });

  describe('Monsoon Reliability Assessment', () => {
    it('should identify good monsoon dependence with strong volume', async () => {
      // Arrange - Typical Vidarbha monsoon pattern
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 900,
        monthlyRainfall: [
          { month: 'Jan', rainfall_mm: 10 },
          { month: 'Feb', rainfall_mm: 5 },
          { month: 'Mar', rainfall_mm: 10 },
          { month: 'Apr', rainfall_mm: 15 },
          { month: 'May', rainfall_mm: 40 },
          { month: 'Jun', rainfall_mm: 200 },
          { month: 'Jul', rainfall_mm: 300 },
          { month: 'Aug', rainfall_mm: 250 },
          { month: 'Sep', rainfall_mm: 150 },
          { month: 'Oct', rainfall_mm: 70 },
          { month: 'Nov', rainfall_mm: 20 },
          { month: 'Dec', rainfall_mm: 10 },
        ],
        annualEvapotranspiration: 1200,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 45,
        forecastRainfall_mm: 60,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.rainfall.monsoonReliability).toContain('Good');
      expect(result.rainfall.monsoonReliability).toContain('monsoon');
    });

    it('should identify distributed rainfall pattern', async () => {
      // Arrange - Rainfall spread across seasons
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 800,
        monthlyRainfall: Array(12).fill({ month: 'Jan', rainfall_mm: 800 / 12 }),
        annualEvapotranspiration: 1000,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 30,
        forecastRainfall_mm: 35,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.rainfall.monsoonReliability).toContain('Distributed');
    });

    it('should identify arid region with very poor monsoon', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 100,
        monthlyRainfall: [{ month: 'Jan', rainfall_mm: 100 }],
        annualEvapotranspiration: 1800,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 0,
        forecastRainfall_mm: 2,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.rainfall.monsoonReliability).toContain('arid');
    });
  });

  describe('Water Availability Assessment', () => {
    it('should classify abundant water availability', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 1800,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 1800 }],
        annualEvapotranspiration: 1200,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 100,
        forecastRainfall_mm: 120,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.irrigationAssessment.waterAvailability).toBe('abundant');
    });

    it('should classify adequate water availability', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 950,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 950 }],
        annualEvapotranspiration: 1100,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 50,
        forecastRainfall_mm: 65,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.irrigationAssessment.waterAvailability).toBe('adequate');
    });

    it('should classify limited water availability', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 550,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 550 }],
        annualEvapotranspiration: 1200,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 25,
        forecastRainfall_mm: 30,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.irrigationAssessment.waterAvailability).toBe('limited');
    });

    it('should classify scarce water availability', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 300,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 300 }],
        annualEvapotranspiration: 1500,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 5,
        forecastRainfall_mm: 10,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.irrigationAssessment.waterAvailability).toBe('scarce');
    });
  });

  describe('Irrigation Method Recommendations', () => {
    it('should recommend drip irrigation for scarce water', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 350,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 350 }],
        annualEvapotranspiration: 1400,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 10,
        forecastRainfall_mm: 15,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.irrigationAssessment.recommendedMethod).toContain('Drip');
      expect(result.irrigationAssessment.recommendedMethod).toContain('strongly recommended');
    });

    it('should recommend multiple irrigation options for abundant water', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 1600,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 1600 }],
        annualEvapotranspiration: 1100,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 80,
        forecastRainfall_mm: 100,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.irrigationAssessment.recommendedMethod).toContain('Multiple');
      expect(result.irrigationAssessment.recommendedMethod).toContain('feasible');
    });
  });

  describe('Crop Water Requirements Assessment', () => {
    it('should assess crop feasibility based on rainfall', async () => {
      // Arrange - Moderate rainfall for Vidarbha
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 850,
        monthlyRainfall: [
          { month: 'Jan', rainfall_mm: 10 },
          { month: 'Feb', rainfall_mm: 8 },
          { month: 'Mar', rainfall_mm: 12 },
          { month: 'Apr', rainfall_mm: 20 },
          { month: 'May', rainfall_mm: 45 },
          { month: 'Jun', rainfall_mm: 180 },
          { month: 'Jul', rainfall_mm: 280 },
          { month: 'Aug', rainfall_mm: 220 },
          { month: 'Sep', rainfall_mm: 150 },
          { month: 'Oct', rainfall_mm: 80 },
          { month: 'Nov', rainfall_mm: 25 },
          { month: 'Dec', rainfall_mm: 12 },
        ],
        annualEvapotranspiration: 1200,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 45,
        forecastRainfall_mm: 60,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.cropWaterRequirements.length).toBeGreaterThan(0);

      // Cotton should be feasible for Vidarbha (Kharif crop)
      const cotton = result.cropWaterRequirements.find(c => c.crop === 'Cotton');
      expect(cotton).toBeTruthy();
      expect(['highly_feasible', 'feasible']).toContain(cotton?.feasibility);

      // Rice should need significant irrigation
      const rice = result.cropWaterRequirements.find(c => c.crop === 'Rice (Paddy)');
      expect(rice).toBeTruthy();
      expect(rice?.irrigationNeeded).toBe(true);
    });

    it('should mark high-water crops as not feasible in low rainfall areas', async () => {
      // Arrange - Very low rainfall
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 300,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 300 }],
        annualEvapotranspiration: 1500,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 5,
        forecastRainfall_mm: 10,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      const rice = result.cropWaterRequirements.find(c => c.crop === 'Rice (Paddy)');
      const sugarcane = result.cropWaterRequirements.find(c => c.crop === 'Sugarcane');

      expect(rice?.feasibility).toBe('not_feasible');
      expect(sugarcane?.feasibility).toBe('not_feasible');
    });

    it('should sort crops by feasibility', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 650,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 650 }],
        annualEvapotranspiration: 1100,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 30,
        forecastRainfall_mm: 40,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      const feasibilityOrder = ['highly_feasible', 'feasible', 'marginal', 'not_feasible'];
      for (let i = 0; i < result.cropWaterRequirements.length - 1; i++) {
        const current = result.cropWaterRequirements[i].feasibility;
        const next = result.cropWaterRequirements[i + 1].feasibility;
        expect(feasibilityOrder.indexOf(current)).toBeLessThanOrEqual(feasibilityOrder.indexOf(next));
      }
    });
  });

  describe('Water Management Recommendations', () => {
    it('should recommend rainwater harvesting for low rainfall areas', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 400,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 400 }],
        annualEvapotranspiration: 1300,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 15,
        forecastRainfall_mm: 20,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('rainwater harvesting')
      );
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('drip irrigation')
      );
    });

    it('should alert for dry conditions', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 700,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 700 }],
        annualEvapotranspiration: 1100,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 5,
        forecastRainfall_mm: 8,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('ALERT')
      );
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('supplementary irrigation')
      );
    });

    it('should recommend drainage for heavy rainfall forecast', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 1200,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 1200 }],
        annualEvapotranspiration: 900,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 50,
        forecastRainfall_mm: 150,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('drainage')
      );
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('Heavy rainfall')
      );
    });

    it('should always recommend water quality testing', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 850,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 850 }],
        annualEvapotranspiration: 1100,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 40,
        forecastRainfall_mm: 50,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('borewell water tested')
      );
    });
  });

  describe('Water Budget Calculation', () => {
    it('should calculate water deficit correctly', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 800,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 800 }],
        annualEvapotranspiration: 1200,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 30,
        forecastRainfall_mm: 40,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.irrigationAssessment.waterBudget).toContain('deficit');
      expect(result.irrigationAssessment.waterBudget).toContain('800mm');
      expect(result.irrigationAssessment.waterBudget).toContain('1200mm');
    });

    it('should identify water surplus', async () => {
      // Arrange
      (nasaPowerApi.fetchNASAPowerData as jest.Mock).mockResolvedValue({
        annualRainfall: 1500,
        monthlyRainfall: [{ month: 'Jun', rainfall_mm: 1500 }],
        annualEvapotranspiration: 1000,
      });

      (openMeteoApi.fetchOpenMeteoData as jest.Mock).mockResolvedValue({
        recentRainfall_mm: 80,
        forecastRainfall_mm: 100,
      });

      // Act
      const result = await analyzeWater(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.irrigationAssessment.waterBudget).toContain('surplus');
    });
  });
});
