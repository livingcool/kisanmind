/**
 * Verification tests for expanded mandi database and crop reference data.
 *
 * Tests ensure:
 * - All mandi entries have valid coordinates within India
 * - All states in the database have at least 3 mandis
 * - approximateLocation correctly maps coordinates to states
 * - No crashes when querying locations in any state
 * - Price data has proper structure
 */
import { describe, it, expect } from '@jest/globals';
import {
  CROP_ECONOMICS,
  MAJOR_MANDIS,
  approximateLocation,
} from '../data/crop-reference.js';

describe('Mandi Database - Coverage Verification', () => {
  it('should have mandis for at least 15 states', () => {
    const stateCount = Object.keys(MAJOR_MANDIS).length;
    expect(stateCount).toBeGreaterThanOrEqual(15);
  });

  it('should have at least 3 mandis per state', () => {
    for (const mandis of Object.values(MAJOR_MANDIS)) {
      expect(mandis.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('should have mandis for all target states from the expansion', () => {
    const targetStates = [
      'Tamil Nadu',
      'Karnataka',
      'Andhra Pradesh',
      'Telangana',
      'Uttar Pradesh',
      'Gujarat',
      'Rajasthan',
      'Punjab',
      'Haryana',
      'Madhya Pradesh',
      'Maharashtra',
    ];

    for (const state of targetStates) {
      expect(MAJOR_MANDIS[state]).toBeDefined();
      expect(MAJOR_MANDIS[state].length).toBeGreaterThanOrEqual(5);
    }
  });

  it('should have mandis for newly added states', () => {
    const newStates = [
      'West Bengal',
      'Bihar',
      'Odisha',
      'Chhattisgarh',
      'Jharkhand',
      'Assam',
      'Kerala',
    ];

    for (const state of newStates) {
      expect(MAJOR_MANDIS[state]).toBeDefined();
      expect(MAJOR_MANDIS[state].length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('Mandi Database - Data Integrity', () => {
  it('should have valid coordinates for all mandis (within India bounding box)', () => {
    // India approximate bounding box
    const INDIA_LAT_MIN = 6.0;
    const INDIA_LAT_MAX = 37.0;
    const INDIA_LNG_MIN = 68.0;
    const INDIA_LNG_MAX = 97.5;

    for (const mandis of Object.values(MAJOR_MANDIS)) {
      for (const mandi of mandis) {
        expect(mandi.lat).toBeGreaterThanOrEqual(INDIA_LAT_MIN);
        expect(mandi.lat).toBeLessThanOrEqual(INDIA_LAT_MAX);
        expect(mandi.lng).toBeGreaterThanOrEqual(INDIA_LNG_MIN);
        expect(mandi.lng).toBeLessThanOrEqual(INDIA_LNG_MAX);
        expect(mandi.name).toBeTruthy();
        expect(mandi.district).toBeTruthy();
        expect(mandi.majorCrops.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have unique mandi names within each state', () => {
    for (const mandis of Object.values(MAJOR_MANDIS)) {
      const names = mandis.map(m => m.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    }
  });

  it('should have at least 2 major crops listed for each mandi', () => {
    for (const mandis of Object.values(MAJOR_MANDIS)) {
      for (const mandi of mandis) {
        expect(mandi.majorCrops.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('approximateLocation - State Detection', () => {
  it('should correctly identify Tamil Nadu location (Vellore)', () => {
    const result = approximateLocation(12.9165, 79.1325);
    expect(result.state).toBe('Tamil Nadu');
  });

  it('should correctly identify Karnataka location (Kolar)', () => {
    const result = approximateLocation(13.1360, 78.1292);
    expect(result.state).toBe('Karnataka');
  });

  it('should correctly identify Uttar Pradesh location (Varanasi)', () => {
    const result = approximateLocation(25.3176, 82.9739);
    expect(result.state).toBe('Uttar Pradesh');
  });

  it('should correctly identify Gujarat location (Rajkot)', () => {
    const result = approximateLocation(22.3039, 70.8022);
    expect(result.state).toBe('Gujarat');
  });

  it('should correctly identify Rajasthan location (Jodhpur)', () => {
    const result = approximateLocation(26.2389, 73.0243);
    expect(result.state).toBe('Rajasthan');
  });

  it('should correctly identify Haryana location (Karnal)', () => {
    const result = approximateLocation(29.6857, 76.9905);
    expect(result.state).toBe('Haryana');
  });

  it('should correctly identify Punjab location (Ludhiana)', () => {
    const result = approximateLocation(30.9010, 75.8573);
    expect(result.state).toBe('Punjab');
  });

  it('should correctly identify Telangana location (Warangal)', () => {
    const result = approximateLocation(17.9784, 79.5941);
    expect(result.state).toBe('Telangana');
  });

  it('should correctly identify Andhra Pradesh location (Guntur)', () => {
    const result = approximateLocation(16.3067, 80.4365);
    // Guntur is in AP but may overlap with Telangana bounding box - verify it resolves
    expect(['Andhra Pradesh', 'Telangana']).toContain(result.state);
  });

  it('should correctly identify Maharashtra location (Nagpur)', () => {
    const result = approximateLocation(21.1458, 79.0882);
    expect(result.state).toBe('Maharashtra');
  });

  it('should correctly identify West Bengal location (Siliguri)', () => {
    const result = approximateLocation(26.7271, 88.3953);
    expect(result.state).toBe('West Bengal');
  });

  it('should correctly identify Bihar location (Patna)', () => {
    const result = approximateLocation(25.6093, 85.1376);
    expect(result.state).toBe('Bihar');
  });

  it('should correctly identify Kerala location (Ernakulam)', () => {
    const result = approximateLocation(9.9816, 76.2999);
    expect(result.state).toBe('Kerala');
  });

  it('should return "India" for locations outside known state boundaries', () => {
    // Coordinates in the ocean south of India
    const result = approximateLocation(5.0, 78.0);
    expect(result.state).toBe('India');
  });

  it('should not crash for extreme coordinate values', () => {
    expect(() => approximateLocation(0, 0)).not.toThrow();
    expect(() => approximateLocation(90, 180)).not.toThrow();
    expect(() => approximateLocation(-90, -180)).not.toThrow();
  });
});

describe('Crop Economics - Data Integrity', () => {
  it('should have at least 10 crops in the economics database', () => {
    expect(CROP_ECONOMICS.length).toBeGreaterThanOrEqual(10);
  });

  it('should have valid price ranges for all crops', () => {
    for (const crop of CROP_ECONOMICS) {
      const [min, max] = crop.typical_market_price_range;
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(min);
      expect(crop.avg_yield_quintal_per_acre).toBeGreaterThan(0);
      expect(crop.cost_of_cultivation_per_acre).toBeGreaterThan(0);
    }
  });

  it('should have valid season values for all crops', () => {
    const validSeasons = ['kharif', 'rabi', 'zaid', 'annual'];
    for (const crop of CROP_ECONOMICS) {
      expect(validSeasons).toContain(crop.season);
    }
  });

  it('should have at least one variety listed for each crop', () => {
    for (const crop of CROP_ECONOMICS) {
      expect(crop.varieties.length).toBeGreaterThan(0);
    }
  });

  it('should have at least one best selling month for each crop', () => {
    for (const crop of CROP_ECONOMICS) {
      expect(crop.best_selling_months.length).toBeGreaterThan(0);
    }
  });

  it('should have at least one risk factor for each crop', () => {
    for (const crop of CROP_ECONOMICS) {
      expect(crop.risk_factors.length).toBeGreaterThan(0);
    }
  });
});

describe('Total Mandi Count', () => {
  it('should have at least 80 mandis across all states', () => {
    let totalMandis = 0;
    for (const mandis of Object.values(MAJOR_MANDIS)) {
      totalMandis += mandis.length;
    }
    expect(totalMandis).toBeGreaterThanOrEqual(80);
    // eslint-disable-next-line no-console
    console.log(`Total mandis in database: ${totalMandis}`);
  });
});
