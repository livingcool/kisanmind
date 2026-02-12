/**
 * Unit tests for SoilGrids API integration
 * Tests API response parsing, caching, and error handling
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { fetchSoilGridsData, extractPropertyValue } from '../../apis/soilgrids.js';
import { CacheManager } from '../../utils/cache.js';
import type { SoilGridsResponse } from '../../types.js';

// Mock axios and CacheManager
jest.mock('axios');
jest.mock('../../utils/cache.js');

const VIDARBHA_LAT = 20.9;
const VIDARBHA_LNG = 77.75;

describe('SoilGrids API Integration', () => {
  let mockCache: jest.Mocked<CacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup cache mock
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
    } as any;

    (CacheManager as jest.MockedClass<typeof CacheManager>).mockImplementation(() => mockCache);
  });

  describe('fetchSoilGridsData', () => {
    it('should fetch and parse SoilGrids data successfully', async () => {
      const mockResponse: SoilGridsResponse = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [VIDARBHA_LNG, VIDARBHA_LAT],
        },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: {
                mapped_units: 'pH*10',
                target_units: 'pH',
                conversion_factor: 1,
              },
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

      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      expect(result).toEqual(mockResponse);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('soilgrids/v2.0/properties/query'),
        expect.objectContaining({
          params: {
            lon: VIDARBHA_LNG,
            lat: VIDARBHA_LAT,
            property: expect.arrayContaining(['phh2o', 'soc', 'nitrogen', 'clay', 'sand']),
            depth: expect.arrayContaining(['0-5cm', '5-15cm', '15-30cm', '30-60cm']),
            value: 'mean',
          },
          timeout: 30000,
        })
      );
    });

    it('should return cached data when available', async () => {
      const cachedData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: { layers: [] },
      };

      mockCache.get.mockReturnValue(cachedData);

      const result = await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      expect(result).toEqual(cachedData);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should cache successful API responses', async () => {
      const mockResponse: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [VIDARBHA_LNG, VIDARBHA_LAT] },
        properties: { layers: [] },
      };

      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      expect(mockCache.set).toHaveBeenCalledWith(expect.any(String), mockResponse);
    });

    it('should return null on API error', async () => {
      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      expect(result).toBeNull();
    });

    it('should return null on timeout', async () => {
      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock).mockRejectedValue(new Error('TIMEOUT'));

      const result = await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      expect(result).toBeNull();
    });

    it('should retry on retryable errors', async () => {
      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock)
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockResolvedValueOnce({ data: { type: 'Feature', geometry: {}, properties: { layers: [] } } });

      const result = await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      expect(result).not.toBeNull();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle coordinates at different precisions', async () => {
      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock).mockResolvedValue({
        data: { type: 'Feature', geometry: {}, properties: { layers: [] } },
      });

      await fetchSoilGridsData(20.937456789, 77.779612345);

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 20.937456789,
            lon: 77.779612345,
          }),
        })
      );
    });

    it('should request all required soil properties', async () => {
      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock).mockResolvedValue({
        data: { type: 'Feature', geometry: {}, properties: { layers: [] } },
      });

      await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      const callParams = (axios.get as jest.Mock).mock.calls[0][1].params;
      expect(callParams.property).toContain('phh2o');
      expect(callParams.property).toContain('soc');
      expect(callParams.property).toContain('nitrogen');
      expect(callParams.property).toContain('clay');
      expect(callParams.property).toContain('sand');
      expect(callParams.property).toContain('silt');
      expect(callParams.property).toContain('cec');
      expect(callParams.property).toContain('bdod');
      expect(callParams.property).toContain('ocd');
    });

    it('should request all depth ranges', async () => {
      mockCache.get.mockReturnValue(undefined);
      (axios.get as jest.Mock).mockResolvedValue({
        data: { type: 'Feature', geometry: {}, properties: { layers: [] } },
      });

      await fetchSoilGridsData(VIDARBHA_LAT, VIDARBHA_LNG);

      const callParams = (axios.get as jest.Mock).mock.calls[0][1].params;
      expect(callParams.depth).toContain('0-5cm');
      expect(callParams.depth).toContain('5-15cm');
      expect(callParams.depth).toContain('15-30cm');
      expect(callParams.depth).toContain('30-60cm');
    });
  });

  describe('extractPropertyValue', () => {
    it('should extract property value from valid response', () => {
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
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

      const value = extractPropertyValue(mockData, 'phh2o', '0-5cm');
      expect(value).toBe(65);
    });

    it('should return null for missing property', () => {
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { layers: [] },
      };

      const value = extractPropertyValue(mockData, 'missing_property', '0-5cm');
      expect(value).toBeNull();
    });

    it('should return null for missing depth', () => {
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
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

      const value = extractPropertyValue(mockData, 'phh2o', '30-60cm');
      expect(value).toBeNull();
    });

    it('should apply conversion factor', () => {
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: {
          layers: [
            {
              name: 'soc',
              unit_measure: { mapped_units: 'dg/kg', target_units: 'g/kg', conversion_factor: 0.1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 100, Q0_05: 80, Q0_5: 100, Q0_95: 120, uncertainty: 10 },
                },
              ],
            },
          ],
        },
      };

      const value = extractPropertyValue(mockData, 'soc', '0-5cm');
      expect(value).toBe(10); // 100 * 0.1
    });

    it('should return null for null mean value', () => {
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: {
          layers: [
            {
              name: 'phh2o',
              unit_measure: { mapped_units: 'pH*10', target_units: 'pH', conversion_factor: 1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: null as any, Q0_05: 55, Q0_5: 65, Q0_95: 75, uncertainty: 5 },
                },
              ],
            },
          ],
        },
      };

      const value = extractPropertyValue(mockData, 'phh2o', '0-5cm');
      expect(value).toBeNull();
    });

    it('should default to 0-5cm depth when not specified', () => {
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: {
          layers: [
            {
              name: 'clay',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 0.1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 350, Q0_05: 300, Q0_5: 350, Q0_95: 400, uncertainty: 30 },
                },
              ],
            },
          ],
        },
      };

      const value = extractPropertyValue(mockData, 'clay');
      expect(value).toBe(35); // 350 * 0.1
    });

    it('should handle multiple layers and extract correct one', () => {
      const mockData: SoilGridsResponse = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
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
              name: 'clay',
              unit_measure: { mapped_units: 'g/kg', target_units: '%', conversion_factor: 0.1 },
              depths: [
                {
                  label: '0-5cm',
                  range: { top_depth: 0, bottom_depth: 5, unit_depth: 'cm' },
                  values: { mean: 400, Q0_05: 350, Q0_5: 400, Q0_95: 450, uncertainty: 30 },
                },
              ],
            },
          ],
        },
      };

      const phValue = extractPropertyValue(mockData, 'phh2o', '0-5cm');
      const clayValue = extractPropertyValue(mockData, 'clay', '0-5cm');

      expect(phValue).toBe(65);
      expect(clayValue).toBe(40);
    });
  });
});
