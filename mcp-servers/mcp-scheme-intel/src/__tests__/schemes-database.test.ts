/**
 * Verification tests for expanded government scheme database.
 *
 * Tests ensure:
 * - All states have scheme entries that load without errors
 * - Scheme data has proper structure (name, eligibility, website)
 * - approximateState correctly maps coordinates to states
 * - No crashes when querying states without specific data
 * - Central schemes are always available
 * - State-specific scheme portals are official government URLs
 */
import { describe, it, expect } from '@jest/globals';
import {
  CENTRAL_SCHEMES,
  STATE_SCHEMES,
  INSURANCE_SCHEMES,
  SUBSIDIES,
  CREDIT_FACILITIES,
  approximateState,
} from '../data/schemes-database.js';
import { getStateSchemesData } from '../apis/state-schemes.js';

describe('Scheme Database - Loading Verification', () => {
  it('should load central schemes without errors', () => {
    expect(CENTRAL_SCHEMES).toBeDefined();
    expect(CENTRAL_SCHEMES.length).toBeGreaterThan(0);
  });

  it('should load state schemes without errors', () => {
    expect(STATE_SCHEMES).toBeDefined();
    expect(Object.keys(STATE_SCHEMES).length).toBeGreaterThan(0);
  });

  it('should load insurance schemes without errors', () => {
    expect(INSURANCE_SCHEMES).toBeDefined();
    expect(INSURANCE_SCHEMES.length).toBeGreaterThan(0);
  });

  it('should load subsidies without errors', () => {
    expect(SUBSIDIES).toBeDefined();
    expect(SUBSIDIES.length).toBeGreaterThan(0);
  });

  it('should load credit facilities without errors', () => {
    expect(CREDIT_FACILITIES).toBeDefined();
    expect(CREDIT_FACILITIES.length).toBeGreaterThan(0);
  });
});

describe('Scheme Database - State Coverage', () => {
  it('should have schemes for at least 15 states', () => {
    const stateCount = Object.keys(STATE_SCHEMES).length;
    expect(stateCount).toBeGreaterThanOrEqual(15);
    // eslint-disable-next-line no-console
    console.log(`States with scheme data: ${stateCount}`);
  });

  it('should have schemes for all originally supported states', () => {
    const originalStates = [
      'Maharashtra',
      'Madhya Pradesh',
      'Telangana',
      'Andhra Pradesh',
    ];
    for (const state of originalStates) {
      expect(STATE_SCHEMES[state]).toBeDefined();
      expect(STATE_SCHEMES[state].length).toBeGreaterThan(0);
    }
  });

  it('should have schemes for all newly added states', () => {
    const newStates = [
      'Tamil Nadu',
      'Karnataka',
      'Uttar Pradesh',
      'Gujarat',
      'Punjab',
      'Haryana',
      'Rajasthan',
      'West Bengal',
      'Bihar',
      'Odisha',
      'Chhattisgarh',
      'Jharkhand',
      'Assam',
      'Kerala',
    ];
    for (const state of newStates) {
      expect(STATE_SCHEMES[state]).toBeDefined();
      expect(STATE_SCHEMES[state].length).toBeGreaterThan(0);
    }
  });
});

describe('Scheme Database - Data Integrity', () => {
  it('should have valid structure for all central schemes', () => {
    for (const scheme of CENTRAL_SCHEMES) {
      expect(scheme.name).toBeTruthy();
      expect(scheme.description).toBeTruthy();
      expect(scheme.benefit).toBeTruthy();
      expect(scheme.eligibility.length).toBeGreaterThan(0);
      expect(scheme.howToApply).toBeTruthy();
      expect(scheme.website).toBeTruthy();
      expect(scheme.website).toMatch(/^https?:\/\//);
    }
  });

  it('should have valid structure for all state schemes', () => {
    for (const schemes of Object.values(STATE_SCHEMES)) {
      for (const scheme of schemes) {
        expect(scheme.name).toBeTruthy();
        expect(scheme.description).toBeTruthy();
        expect(scheme.benefit).toBeTruthy();
        expect(scheme.eligibility.length).toBeGreaterThan(0);
        expect(scheme.howToApply).toBeTruthy();
        expect(scheme.website).toBeTruthy();
        expect(scheme.website).toMatch(/^https?:\/\//);
      }
    }
  });

  it('should have valid category for all schemes', () => {
    const validCategories = [
      'income_support',
      'insurance',
      'subsidy',
      'credit',
      'irrigation',
      'marketing',
      'training',
    ];

    const allSchemes = [
      ...CENTRAL_SCHEMES,
      ...Object.values(STATE_SCHEMES).flat(),
    ];

    for (const scheme of allSchemes) {
      expect(validCategories).toContain(scheme.category);
    }
  });

  it('should use official government URLs for scheme websites', () => {
    // All scheme websites should be on government domains or known official portals
    const allSchemes = [
      ...CENTRAL_SCHEMES,
      ...Object.values(STATE_SCHEMES).flat(),
    ];

    for (const scheme of allSchemes) {
      // Government sites typically use .gov.in, .nic.in, .org, or state portals
      const url = scheme.website.toLowerCase();
      const isGovDomain =
        url.includes('.gov.') ||
        url.includes('.nic.') ||
        url.includes('.org') ||
        url.includes('nabard') ||
        url.includes('krishakbandhu') ||
        url.includes('upagriculture');
      expect(isGovDomain).toBe(true);
    }
  });
});

describe('approximateState - State Detection', () => {
  it('should correctly identify Tamil Nadu (Vellore coordinates)', () => {
    expect(approximateState(12.9165, 79.1325)).toBe('Tamil Nadu');
  });

  it('should correctly identify Karnataka (Mysuru coordinates)', () => {
    expect(approximateState(12.2958, 76.6394)).toBe('Karnataka');
  });

  it('should correctly identify UP (Lucknow coordinates)', () => {
    expect(approximateState(26.8467, 80.9462)).toBe('Uttar Pradesh');
  });

  it('should correctly identify Gujarat (Rajkot coordinates)', () => {
    expect(approximateState(22.3039, 70.8022)).toBe('Gujarat');
  });

  it('should correctly identify Haryana (Karnal coordinates)', () => {
    expect(approximateState(29.6857, 76.9905)).toBe('Haryana');
  });

  it('should correctly identify Punjab (Amritsar coordinates)', () => {
    expect(approximateState(31.6340, 74.8723)).toBe('Punjab');
  });

  it('should correctly identify Kerala (Ernakulam coordinates)', () => {
    expect(approximateState(9.9816, 76.2999)).toBe('Kerala');
  });

  it('should correctly identify West Bengal (Kolkata area)', () => {
    expect(approximateState(22.5958, 88.2636)).toBe('West Bengal');
  });

  it('should correctly identify Bihar (Patna coordinates)', () => {
    expect(approximateState(25.6093, 85.1376)).toBe('Bihar');
  });

  it('should return "India" for unknown locations', () => {
    expect(approximateState(5.0, 78.0)).toBe('India');
  });

  it('should not crash for any coordinate values', () => {
    expect(() => approximateState(0, 0)).not.toThrow();
    expect(() => approximateState(90, 180)).not.toThrow();
    expect(() => approximateState(-90, -180)).not.toThrow();
  });
});

describe('State Schemes API - Graceful Fallback', () => {
  it('should return data for known states without errors', () => {
    const knownStates = [
      'Maharashtra',
      'Tamil Nadu',
      'Karnataka',
      'Punjab',
      'Gujarat',
      'Uttar Pradesh',
      'Haryana',
      'Rajasthan',
      'Madhya Pradesh',
      'Telangana',
      'Andhra Pradesh',
      'West Bengal',
      'Bihar',
      'Odisha',
      'Chhattisgarh',
      'Jharkhand',
      'Assam',
      'Kerala',
    ];

    for (const state of knownStates) {
      const result = getStateSchemesData(state);
      expect(result).toBeDefined();
      expect(result.schemes).toBeDefined();
      expect(result.schemes.length).toBeGreaterThan(0);
      expect(result.subsidies).toBeDefined();
      expect(result.creditFacilities).toBeDefined();
    }
  });

  it('should not crash for unknown states and return common schemes only', () => {
    const unknownStates = [
      'Manipur',
      'Nagaland',
      'Tripura',
      'Mizoram',
      'Arunachal Pradesh',
      'Sikkim',
      'Meghalaya',
      'Goa',
      'Unknown State',
    ];

    for (const state of unknownStates) {
      expect(() => getStateSchemesData(state)).not.toThrow();
      const result = getStateSchemesData(state);
      // Should still return common/central schemes
      expect(result.schemes.length).toBeGreaterThan(0);
      expect(result.subsidies.length).toBeGreaterThan(0);
      expect(result.creditFacilities.length).toBeGreaterThan(0);
    }
  });

  it('should always include common schemes for every state', () => {
    const result = getStateSchemesData('NonExistentState');
    // Common schemes include Soil Health Card and KCC
    const schemeNames = result.schemes.map(s => s.name);
    expect(schemeNames).toContain('Soil Health Card Scheme');
    expect(schemeNames).toContain('Kisan Credit Card (KCC)');
  });
});

describe('Scenario Tests - Specific Farmer Locations', () => {
  it('should provide Tamil Nadu schemes for Vellore farmer', () => {
    const state = approximateState(12.9165, 79.1325);
    expect(state).toBe('Tamil Nadu');
    const schemes = STATE_SCHEMES[state];
    expect(schemes).toBeDefined();
    expect(schemes.length).toBeGreaterThan(0);
    // Check for TN-specific scheme
    const tnSchemeNames = schemes.map(s => s.name);
    expect(tnSchemeNames.some(n => n.includes('Uzhavar') || n.includes('Tamil Nadu'))).toBe(true);
  });

  it('should provide UP schemes for Ayodhya/Lucknow farmer', () => {
    const state = approximateState(26.8, 82.2);
    expect(state).toBe('Uttar Pradesh');
    const schemes = STATE_SCHEMES[state];
    expect(schemes).toBeDefined();
    const upSchemeNames = schemes.map(s => s.name);
    expect(upSchemeNames.some(n => n.includes('UP') || n.includes('Uttar Pradesh'))).toBe(true);
  });

  it('should provide Gujarat schemes for Rajkot farmer', () => {
    const state = approximateState(22.3039, 70.8022);
    expect(state).toBe('Gujarat');
    const schemes = STATE_SCHEMES[state];
    expect(schemes).toBeDefined();
    const gjSchemeNames = schemes.map(s => s.name);
    expect(gjSchemeNames.some(n => n.includes('Gujarat') || n.includes('Kisan Sahay') || n.includes('Khedut'))).toBe(true);
  });

  it('should provide Telangana schemes for Warangal farmer', () => {
    const state = approximateState(17.9784, 79.5941);
    expect(state).toBe('Telangana');
    const schemes = STATE_SCHEMES[state];
    expect(schemes).toBeDefined();
    const tsSchemeNames = schemes.map(s => s.name);
    expect(tsSchemeNames.some(n => n.includes('Rythu'))).toBe(true);
  });
});

describe('Total Scheme Count', () => {
  it('should have a substantial number of schemes across all sources', () => {
    const centralCount = CENTRAL_SCHEMES.length;
    let stateTotal = 0;
    for (const schemes of Object.values(STATE_SCHEMES)) {
      stateTotal += schemes.length;
    }
    const insuranceCount = INSURANCE_SCHEMES.length;
    const subsidyCount = SUBSIDIES.length;
    const creditCount = CREDIT_FACILITIES.length;

    const total = centralCount + stateTotal + insuranceCount + subsidyCount + creditCount;
    expect(total).toBeGreaterThanOrEqual(40);

    // eslint-disable-next-line no-console
    console.log(`Total scheme entries: ${total}`);
    console.log(`  Central: ${centralCount}, State: ${stateTotal}, Insurance: ${insuranceCount}, Subsidies: ${subsidyCount}, Credit: ${creditCount}`);
  });
});
