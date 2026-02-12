/**
 * Unit tests for soil analyzer functionality
 * Tests soil analysis logic, property rating, and crop suitability assessment
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { analyzeSoil } from '../soil-analyzer.js';
import * as soilgridsApi from '../apis/soilgrids.js';
import * as openlandmapApi from '../apis/openlandmap.js';
import type { SoilGridsResponse } from '../types.js';

// Mock the API modules
jest.mock('../apis/soilgrids.js');
jest.mock('../apis/openlandmap.js');

// Test coordinates for Vidarbha, Maharashtra
const VIDARBHA_LAT = 20.9;
const VIDARBHA_LNG = 77.75;

describe('Soil Analyzer - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeSoil', () => {
    it('should successfully analyze soil with complete data from both APIs', async () => {
      // Arrange - Mock successful API responses
      const mockSoilGridsData: SoilGridsResponse = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [VIDARBHA_LNG, VIDARBHA_LAT],
        },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 65, Q0_05: 55, Q0_5: 65, Q0_95: 75, uncertainty: 5 },
                },
              ],
            },
            {
              name: 'soc',
              unit_measure: { mapped_units: 'dg/kg', target_units: 'g/kg', conversion_factor: 1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 15, Q0_05: 10, Q0_5: 15, Q0_95: 20, uncertainty: 3 },
                },
              ],
            },
            {
              name: 'clay',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 350, Q0_05: 300, Q0_5: 350, Q0_95: 400, uncertainty: 30 },
                },
              ],
            },
            {
              name: 'sand',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 450, Q0_05: 400, Q0_5: 450, Q0_95: 500, uncertainty: 40 },
                },
              ],
            },
            {
              name: 'silt',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 200, Q0_05: 150, Q0_5: 200, Q0_95: 250, uncertainty: 25 },
                },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockSoilGridsData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue({
        soilType: 'Vertisol',
      });

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.status).toBe('success');
      expect(result.location.latitude).toBe(VIDARBHA_LAT);
      expect(result.location.longitude).toBe(VIDARBHA_LNG);
      expect(result.dataSources).toContain('ISRIC SoilGrids v2.0');
      expect(result.dataSources).toContain('OpenLandMap');
      expect(result.soilProperties.pH).toBeTruthy();
      expect(result.soilProperties.clay).toBeTruthy();
      expect(result.cropSuitability.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeTruthy();
    });

    it('should handle partial data when SoilGrids API fails', async () => {
      // Arrange
      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(null);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue({
        soilType: 'Vertisol',
      });

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.status).toBe('partial');
      expect(result.dataSources).toContain('OpenLandMap');
      expect(result.dataSources).not.toContain('ISRIC SoilGrids v2.0');
    });

    it('should handle partial data when OpenLandMap API fails', async () => {
      // Arrange
      const mockSoilGridsData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 70, Q0_05: 60, Q0_5: 70, Q0_95: 80, uncertainty: 5 },
                },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockSoilGridsData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.status).toBe('partial');
      expect(result.dataSources).toContain('ISRIC SoilGrids v2.0');
    });

    it('should return error status when all APIs fail', async () => {
      // Arrange
      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(null);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.status).toBe('error');
      expect(result.dataSources.length).toBe(0);
    });

    it('should correctly convert SoilGrids units (pH from pH*10)', async () => {
      // Arrange - pH of 65 should become 6.5
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 65, Q0_05: 55, Q0_5: 65, Q0_95: 75, uncertainty: 5 },
                },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.soilProperties.pH?.value).toBeCloseTo(6.5, 1);
      expect(result.soilProperties.pH?.unit).toBe('pH units');
    });
  });

  describe('Crop Suitability Assessment', () => {
    it('should recommend cotton as highly suitable for Vidarbha-like conditions', async () => {
      // Arrange - Simulate Vidarbha black soil conditions
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 75, Q0_05: 65, Q0_5: 75, Q0_95: 85, uncertainty: 5 } },
              ],
            },
            {
              name: 'clay',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 400, Q0_05: 350, Q0_5: 400, Q0_95: 450, uncertainty: 30 } },
              ],
            },
            {
              name: 'sand',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 300, Q0_05: 250, Q0_5: 300, Q0_95: 350, uncertainty: 30 } },
              ],
            },
            {
              name: 'silt',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 300, Q0_05: 250, Q0_5: 300, Q0_95: 350, uncertainty: 25 } },
              ],
            },
            {
              name: 'soc',
              unit_measure: { mapped_units: 'dg/kg', target_units: 'g/kg', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 15, Q0_05: 10, Q0_5: 15, Q0_95: 20, uncertainty: 3 } },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      const cottonSuitability = result.cropSuitability.find(c => c.crop === 'Cotton');
      expect(cottonSuitability).toBeTruthy();
      expect(['highly_suitable', 'suitable']).toContain(cottonSuitability?.suitability);
    });

    it('should recommend rice for clay-rich soils with good water retention', async () => {
      // Arrange
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 65, Q0_05: 55, Q0_5: 65, Q0_95: 75, uncertainty: 5 } },
              ],
            },
            {
              name: 'clay',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 450, Q0_05: 400, Q0_5: 450, Q0_95: 500, uncertainty: 30 } },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      const riceSuitability = result.cropSuitability.find(c => c.crop === 'Rice (Paddy)');
      expect(riceSuitability).toBeTruthy();
      expect(['highly_suitable', 'moderately_suitable']).toContain(riceSuitability?.suitability);
    });

    it('should recommend groundnut for sandy, well-drained soils', async () => {
      // Arrange
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 65, Q0_05: 55, Q0_5: 65, Q0_95: 75, uncertainty: 5 } },
              ],
            },
            {
              name: 'sand',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 700, Q0_05: 650, Q0_5: 700, Q0_95: 750, uncertainty: 40 } },
              ],
            },
            {
              name: 'clay',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 150, Q0_05: 100, Q0_5: 150, Q0_95: 200, uncertainty: 30 } },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      const groundnutSuitability = result.cropSuitability.find(c => c.crop === 'Groundnut');
      expect(groundnutSuitability).toBeTruthy();
      expect(['highly_suitable', 'moderately_suitable']).toContain(groundnutSuitability?.suitability);
    });
  });

  describe('Soil Management Recommendations', () => {
    it('should recommend lime application for acidic soil (pH < 5.5)', async () => {
      // Arrange
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 50, Q0_05: 45, Q0_5: 50, Q0_95: 55, uncertainty: 3 } },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('lime')
      );
    });

    it('should recommend gypsum for alkaline soil (pH > 8.0)', async () => {
      // Arrange
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 85, Q0_05: 80, Q0_5: 85, Q0_95: 90, uncertainty: 3 } },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('gypsum')
      );
    });

    it('should recommend organic matter addition for low organic carbon', async () => {
      // Arrange
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: {
          layers: [
            {
              name: 'soc',
              unit_measure: { mapped_units: 'dg/kg', target_units: 'g/kg', conversion_factor: 1 },
              depths: [
                { label: '0-5cm', range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' }, values: { mean: 5, Q0_05: 3, Q0_5: 5, Q0_95: 7, uncertainty: 2 } },
              ],
            },
          ],
        },
      };

      (soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockData);
      (openlandmapApi.fetchOpenLandMapData as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await analyzeSoil(VIDARBHA_LAT, VIDARBHA_LNG);

      // Assert
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('farmyard manure')
      );
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('green manuring')
      );
    });
  });
});
