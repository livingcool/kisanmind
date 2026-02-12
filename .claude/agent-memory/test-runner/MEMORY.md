# Test Runner Memory

## Project Testing Structure

KisanMind uses Jest with ts-jest for TypeScript testing. Tests are organized in `__tests__` directories within each MCP server's `src/` folder.

## Key Testing Patterns

### Mock Setup for MCP Servers

```typescript
// Always mock external API modules
jest.mock('../apis/soilgrids.js');
jest.mock('../apis/openlandmap.js');

// Cast to jest.Mock when calling
(soilgridsApi.fetchSoilGridsData as jest.Mock).mockResolvedValue(mockData);
```

### Test Coordinates

**Vidarbha, Maharashtra** (primary test location):
- Latitude: 20.9, Longitude: 77.75
- Represents typical Indian farmer scenario
- Black soil (Vertisol), monsoon-dependent rainfall
- Key crops: Cotton, Soybean, Gram

### Common Test Scenarios

1. **Success Path**: Both APIs return complete data → status: 'success'
2. **Partial Data**: One API fails → status: 'partial'
3. **Total Failure**: All APIs fail → status: 'error'
4. **Edge Cases**: Invalid coordinates, null values, missing properties

### Mock Data Structures

SoilGrids response requires specific structure:
```typescript
{
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lng, lat] },
  properties: {
    layers: [
      {
        name: 'phh2o',
        unit_measure: { conversion_factor: 1 },
        depths: [{ label: '0-5cm', values: { mean: 65 } }]
      }
    ]
  }
}
```

## Effective Test Assertions

- Use `toContain()` for array membership
- Use `toContainEqual()` for object arrays
- Use `expect.stringContaining()` for partial string matches
- Use `toBeCloseTo()` for floating point comparisons

## Common Pitfalls

1. **Forgetting to clear mocks**: Always use `beforeEach(() => jest.clearAllMocks())`
2. **Not handling async/await**: All analyzer functions are async
3. **Console spy leaks**: Always restore spies in `afterEach()`
4. **ESM imports**: Use `.js` extensions in imports even for `.ts` files

## Test Coverage Priorities

1. **Critical Path**: Soil & Water analyzers (most complex logic)
2. **Utility Functions**: Retry, cache, error-handler (reused everywhere)
3. **API Integrations**: SoilGrids, NASA POWER, Open-Meteo
4. **MCP Protocol**: Tool registration and execution

## Jest Configuration Notes

- `extensionsToTreatAsEsm: ['.ts']` required for ESM support
- `moduleNameMapper` strips `.js` from imports for resolution
- `testEnvironment: 'node'` for server-side code
- `roots` includes both mcp-servers and orchestrator

## Flaky Test Prevention

- Don't rely on external APIs in tests (always mock)
- Use short timeouts in retry tests (10ms instead of real delays)
- Avoid time-sensitive assertions (use relative comparisons)
- Mock Date.now() if testing time-dependent logic

## Missing node-cache Dependency

Cache tests require `node-cache` npm package. If tests fail with "Cannot find module 'node-cache'", install it:
```bash
npm install --save node-cache
```

## Test Organization Best Practices

- Group related tests with `describe()` blocks
- Use descriptive test names: "should X when Y"
- Put setup code in `beforeEach()`, not at describe level
- Keep tests independent (no shared state between tests)
