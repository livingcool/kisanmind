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

## Visual Assessment Feature Testing (Feb 2026)

### Test Suite Status
- ✅ Database layer (`visual-assessment-db.test.ts`): 13 tests, 100% passing
- ✅ Type validation (`visual-intelligence.test.ts`): 12 tests, 100% passing
- ✅ ML service logic (`test_app.py`): 3 tests, 100% passing
- ⚠️ API routes: Not yet tested (need supertest integration)
- ⚠️ E2E flows: Not yet tested

### Mock Data Factory Pattern
Use factory functions with partial overrides for flexible test data:
```typescript
const createMockAssessment = (overrides: Partial<Type> = {}): Type => ({
  ...defaultValues,
  ...overrides,
});
```

### External Service Testing
Check availability in beforeAll and skip gracefully if unavailable:
```typescript
beforeAll(async () => {
  const isRunning = await isServiceRunning();
  if (!isRunning) console.warn('Service not running...');
});
```

### Test Case ID Pattern
Link tests to test plan with TC IDs:
```typescript
it('TC4.1: should store and retrieve assessment', () => {});
```

### Performance Benchmarks
- Database operations: <2ms
- ML inference (Python): ~160ms
- Type conversions: <1ms
- Test execution: ~100ms/test average

### Jest Root Configuration Issue
Tests must be in `__tests__` directories within roots specified in jest.config.js.
Don't create `tests/` at project root - move to component-specific `__tests__` folders.

## Frontend Testing (Vitest)

### Camera Dark Screen Fix (Feb 2026)

**Critical Issue Resolved**: Camera preview showed black screen due to race condition between React ref attachment and MediaStream assignment.

**Solution**: Added useEffect to sync stream to video element when stream state changes:
```typescript
useEffect(() => {
  if (videoRef.current && streamRef.current) {
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(console.warn);
  }
}, [state.stream]);
```

**Files**: See [camera-testing-notes.md](./camera-testing-notes.md) for detailed patterns.

### Vitest Setup

- Config: `frontend/vitest.config.ts`
- Setup: `frontend/vitest.setup.ts` (mocks MediaStream, video element, canvas)
- Tests: `__tests__/` directories in component folders

### Test Results
- ✅ CameraCapture Component: 8/8 tests passing
- ⚠️ useVideoStream Hook: 5/23 passing (implementation detail tests need refactoring)

### Key Patterns

1. **Mock hooks module-level**: `vi.mock('../hooks/useVideoStream')`
2. **Override in beforeEach**: Use `vi.mocked()` for test-specific behavior
3. **Test behavior, not internals**: Focus on user-facing functionality
4. **Avoid testing ref timing**: Race conditions make these tests flaky

### Commands
```bash
cd frontend
npm test              # Watch mode
npm test -- --run     # Run once
npm test:coverage     # Coverage report
```
