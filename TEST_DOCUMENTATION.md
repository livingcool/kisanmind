# KisanMind Test Documentation

## Overview

This document describes the comprehensive test suite for the KisanMind agricultural intelligence platform. Tests are organized by MCP server and cover unit tests, API integration tests, and end-to-end scenarios.

## Test Structure

```
kisanmind/
├── mcp-servers/
│   ├── mcp-soil-intel/
│   │   └── src/__tests__/
│   │       ├── soil-analyzer.test.ts         # Core soil analysis logic
│   │       ├── index.test.ts                 # MCP server integration
│   │       ├── apis/
│   │       │   └── soilgrids.test.ts         # SoilGrids API integration
│   │       └── utils/
│   │           ├── logger.test.ts            # Logger utility tests
│   │           ├── cache.test.ts             # Cache manager tests
│   │           ├── retry.test.ts             # Retry logic tests
│   │           └── error-handler.test.ts     # Error handling tests
│   ├── mcp-water-intel/
│   │   └── src/__tests__/
│   │       └── water-analyzer.test.ts        # Water analysis logic
│   └── ... (other MCP servers)
└── jest.config.js                            # Jest configuration
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests for a Specific MCP Server
```bash
# Soil Intel tests
npx jest mcp-servers/mcp-soil-intel

# Water Intel tests
npx jest mcp-servers/mcp-water-intel
```

### Run a Specific Test File
```bash
npx jest soil-analyzer.test.ts
```

### Run Tests with Coverage
```bash
npx jest --coverage
```

## Test Coverage Goals

- **Unit Tests**: >80% code coverage for all utility functions and analyzers
- **Integration Tests**: All MCP tools tested with mock API responses
- **Error Handling**: All error paths tested (network errors, invalid input, API failures)
- **Edge Cases**: Boundary conditions, null values, missing data scenarios

## Test Categories

### 1. MCP Server Tests (`index.test.ts`)

Tests the MCP protocol implementation:
- Tool registration (ListTools)
- Tool execution (CallTool)
- Input validation
- Error response formatting
- MCP protocol compliance

### 2. Analyzer Tests

#### Soil Analyzer (`soil-analyzer.test.ts`)
- Soil property extraction and rating
- Crop suitability assessment
- Soil texture classification
- Drainage class determination
- Fertility summary generation
- Management recommendations

**Key Test Scenarios:**
- Vidarbha black soil conditions (cotton suitable)
- Clay-rich soils (rice suitable)
- Sandy soils (groundnut suitable)
- Acidic soil corrections
- Alkaline soil corrections
- Low organic carbon management

#### Water Analyzer (`water-analyzer.test.ts`)
- Rainfall pattern analysis
- Drought risk assessment
- Monsoon reliability evaluation
- Water availability classification
- Irrigation method recommendations
- Crop water requirement feasibility

**Key Test Scenarios:**
- Monsoon-dependent regions (Vidarbha pattern)
- Low rainfall areas (drip irrigation)
- Abundant water regions (drainage management)
- Dry spell alerts
- Heavy rainfall warnings

### 3. Utility Tests

#### Logger (`utils/logger.test.ts`)
- Log level filtering (info, warn, error, debug)
- DEBUG flag behavior
- Timestamp formatting
- Context prefixing

#### Cache Manager (`utils/cache.test.ts`)
- Basic cache operations (get, set, has, delete, clear)
- Custom TTL handling
- Coordinate key generation
- Precision rounding (4 decimal places)
- Cache statistics

#### Retry Logic (`utils/retry.test.ts`)
- Exponential backoff
- Retryable errors (503, 429, TIMEOUT, ECONNRESET)
- Non-retryable errors (404, 401, validation)
- Max attempts enforcement
- Error preservation

#### Error Handler (`utils/error-handler.test.ts`)
- Rate limit error formatting
- Timeout error formatting
- Network error formatting
- Invalid coordinates validation
- No data available errors
- DEBUG mode technical details

### 4. API Integration Tests

#### SoilGrids API (`apis/soilgrids.test.ts`)
- Successful data fetching
- Cache hit/miss behavior
- Response parsing
- Property value extraction
- Unit conversion (pH*10 → pH, g/kg → %)
- Retry on transient errors
- Null/missing data handling

## Test Data

### Reference Coordinates

**Vidarbha, Maharashtra** (Primary test location):
- Latitude: 20.9°N
- Longitude: 77.75°E
- Soil Type: Black soil (Vertisol)
- Annual Rainfall: ~850mm (monsoon-dependent)
- Key Crops: Cotton, Soybean, Gram

### Mock API Responses

Tests use realistic mock data based on actual API response structures. See individual test files for complete mock payloads.

## Mocking Strategy

- **External APIs**: Fully mocked using Jest mocks
- **File System**: Not mocked (cache uses in-memory NodeCache)
- **Date/Time**: Not mocked (tests use relative assertions)
- **Console**: Mocked in logger tests to verify output

## Common Test Patterns

### AAA Pattern (Arrange-Act-Assert)
```typescript
it('should do something', async () => {
  // Arrange
  const mockData = { ... };
  (apiFunction as jest.Mock).mockResolvedValue(mockData);

  // Act
  const result = await analyzerFunction(lat, lng);

  // Assert
  expect(result.status).toBe('success');
  expect(result.data).toEqual(mockData);
});
```

### Error Testing
```typescript
it('should handle API errors gracefully', async () => {
  // Arrange
  (apiFunction as jest.Mock).mockRejectedValue(new Error('API Error'));

  // Act
  const result = await analyzerFunction(lat, lng);

  // Assert
  expect(result.status).toBe('error');
  expect(result.error).toBeTruthy();
});
```

### Edge Case Testing
```typescript
it('should validate coordinate boundaries', () => {
  expect(() => validateCoordinates(91, 0)).toThrow('INVALID_COORDINATES');
  expect(() => validateCoordinates(-91, 0)).toThrow('INVALID_COORDINATES');
  expect(() => validateCoordinates(0, 181)).toThrow('INVALID_COORDINATES');
  expect(() => validateCoordinates(0, -181)).toThrow('INVALID_COORDINATES');
});
```

## Debugging Failed Tests

### Enable Verbose Output
```bash
npx jest --verbose
```

### Enable DEBUG Logging
```bash
DEBUG=true npx jest
```

### Run Single Test
```bash
npx jest -t "should analyze soil with complete data"
```

### Check Test Coverage Gaps
```bash
npx jest --coverage --coverageReporters=html
# Open coverage/index.html in browser
```

## Known Test Limitations

1. **MCP Protocol Testing**: Full MCP server integration tests require server instance setup. Current tests focus on individual components.

2. **Rate Limit Testing**: Tests don't actually wait for delays in retry logic (tests use short timeouts for speed).

3. **Live API Testing**: All external APIs are mocked. Consider adding integration test suite with live APIs (use sparingly due to rate limits).

4. **Time-Dependent Tests**: Some rainfall forecast tests may be sensitive to timing. Use frozen timestamps if flakiness occurs.

## Future Test Enhancements

- [ ] Add integration tests for orchestrator (Opus 4.6 agent coordination)
- [ ] Add E2E tests for complete farmer input → report flow
- [ ] Add performance benchmarks for analysis latency
- [ ] Add snapshot testing for report output formats
- [ ] Add contract tests for API response schemas
- [ ] Add load testing for concurrent MCP requests
- [ ] Add mutation testing for test quality verification

## Continuous Integration

Tests should run on every commit via CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test

- name: Upload Coverage
  run: npm run test:coverage
  # Upload to Codecov or similar
```

## Contributing Test Guidelines

When adding new features:

1. Write tests BEFORE implementation (TDD)
2. Aim for >80% code coverage
3. Include positive and negative test cases
4. Test edge cases and boundary conditions
5. Mock external dependencies
6. Use descriptive test names
7. Add comments for complex test scenarios
8. Keep tests fast (<100ms per test)

## Test Maintenance Notes

- Update mock data when API schemas change
- Review and update test coordinates if regional data changes
- Keep test data realistic and based on actual farmer scenarios
- Remove obsolete tests when refactoring
- Update documentation when adding new test categories

---

**Last Updated**: 2026-02-12
**Test Framework**: Jest 29.7.0 with ts-jest
**Test Runner**: Node.js with TypeScript ESM modules
