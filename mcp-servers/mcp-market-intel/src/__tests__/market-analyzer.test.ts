/**
 * Integration tests for market analyzer.
 *
 * Tests that the full analysis pipeline works end-to-end for
 * locations across India without crashing, including:
 * - New states with expanded mandi data
 * - States with limited data (graceful fallback)
 * - Edge case coordinates
 */
import { describe, it, expect } from '@jest/globals';
import { analyzeMarket } from '../market-analyzer.js';

describe('Market Analyzer - End-to-End Analysis', () => {
  it('should successfully analyze market for Vellore, Tamil Nadu', async () => {
    const result = await analyzeMarket(12.9165, 79.1325);
    expect(result.status).toBe('success');
    expect(result.location.state).toBe('Tamil Nadu');
    expect(result.nearbyMandis.length).toBeGreaterThan(0);
    expect(result.cropPrices.length).toBeGreaterThan(0);
    expect(result.profitEstimates.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should successfully analyze market for Lucknow, UP', async () => {
    const result = await analyzeMarket(26.8467, 80.9462);
    expect(result.status).toBe('success');
    expect(result.location.state).toBe('Uttar Pradesh');
    expect(result.nearbyMandis.length).toBeGreaterThan(0);
  });

  it('should successfully analyze market for Karnal, Haryana', async () => {
    const result = await analyzeMarket(29.6857, 76.9905);
    expect(result.status).toBe('success');
    expect(result.location.state).toBe('Haryana');
    expect(result.nearbyMandis.length).toBeGreaterThan(0);
  });

  it('should successfully analyze market for Rajkot, Gujarat', async () => {
    const result = await analyzeMarket(22.3039, 70.8022);
    expect(result.status).toBe('success');
    expect(result.location.state).toBe('Gujarat');
    expect(result.nearbyMandis.length).toBeGreaterThan(0);
  });

  it('should successfully analyze market for Patna, Bihar', async () => {
    const result = await analyzeMarket(25.6093, 85.1376);
    expect(result.status).toBe('success');
    expect(result.location.state).toBe('Bihar');
    expect(result.nearbyMandis.length).toBeGreaterThan(0);
  });

  it('should successfully analyze market for Ernakulam, Kerala', async () => {
    const result = await analyzeMarket(9.9816, 76.2999);
    expect(result.status).toBe('success');
    expect(result.location.state).toBe('Kerala');
    expect(result.nearbyMandis.length).toBeGreaterThan(0);
  });

  it('should handle unknown locations gracefully', async () => {
    // Coordinates in the ocean
    const result = await analyzeMarket(5.0, 78.0);
    expect(result.status).toBe('success');
    expect(result.location.state).toBe('India');
    // Should still find some mandis (nearest across India)
    expect(result.nearbyMandis.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should include data source attribution', async () => {
    const result = await analyzeMarket(20.9, 77.75);
    expect(result.dataSources).toBeDefined();
    expect(result.dataSources.length).toBeGreaterThan(0);
  });

  it('should have a valid timestamp', async () => {
    const result = await analyzeMarket(20.9, 77.75);
    expect(result.timestamp).toBeTruthy();
    expect(() => new Date(result.timestamp)).not.toThrow();
  });
});

describe('Market Analyzer - Vidarbha Demo Case', () => {
  it('should provide analysis for Vidarbha, Maharashtra (demo case)', async () => {
    // Vidarbha region (Yavatmal area)
    const result = await analyzeMarket(20.3888, 78.1204);
    expect(result.status).toBe('success');
    expect(result.location.state).toBe('Maharashtra');

    // Cotton should be in profit estimates (Vidarbha is cotton country)
    const hasCotton = result.profitEstimates.some(p => p.crop.includes('Cotton'));
    expect(hasCotton).toBe(true);

    // Should have nearby mandis in Vidarbha region
    const nearbyMandiNames = result.nearbyMandis.map(m => m.name);
    expect(nearbyMandiNames.length).toBeGreaterThan(0);
  });
});

describe('Market Analyzer - Profit Estimates', () => {
  it('should return profit estimates sorted by profit (highest first)', async () => {
    const result = await analyzeMarket(22.7196, 75.8577); // Indore, MP
    expect(result.profitEstimates.length).toBeGreaterThan(0);

    for (let i = 1; i < result.profitEstimates.length; i++) {
      expect(result.profitEstimates[i - 1].estimatedProfit_per_acre)
        .toBeGreaterThanOrEqual(result.profitEstimates[i].estimatedProfit_per_acre);
    }
  });

  it('should have valid profit calculation for all crops', async () => {
    const result = await analyzeMarket(22.7196, 75.8577);
    for (const est of result.profitEstimates) {
      expect(est.estimatedRevenue_per_acre).toBe(
        est.expectedYield_quintal_per_acre * est.expectedPrice_per_quintal
      );
      expect(est.estimatedProfit_per_acre).toBe(
        est.estimatedRevenue_per_acre - est.estimatedCost_per_acre
      );
    }
  });
});
