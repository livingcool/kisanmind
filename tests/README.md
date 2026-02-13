# KisanMind Test Suite

This directory contains test plans, results, and documentation for the KisanMind visual assessment feature.

## Quick Start

### Run All Visual Assessment Tests
```bash
npm test -- --testPathPattern="(visual-assessment-db|visual-intelligence)"
```

### Run Specific Test Suites
```bash
# Database tests
npm test -- api-server/__tests__/visual-assessment-db.test.ts

# Type integration tests
npm test -- orchestrator/__tests__/visual-intelligence.test.ts

# Python ML service tests
cd services/ml-inference && py test_app.py
```

### View Test Coverage
```bash
npm test -- --coverage --testPathPattern=visual-assessment
```

## Test Documentation

### 📋 Test Plan
**File:** `visual-assessment-test-plan.md`
- Comprehensive test plan with 60+ test cases
- Organized into 6 categories
- Expected results and success criteria

### 📊 Test Results
**File:** `visual-assessment-test-results.log`
- Detailed execution logs with timestamps
- Performance metrics
- Known issues and recommendations

### 📄 Test Summary
**File:** `VISUAL-ASSESSMENT-TEST-SUMMARY.md`
- Executive summary of test execution
- Coverage breakdown
- Next steps and priorities

## Current Test Status

### ✅ Implemented & Passing (28 tests)
- Database layer: 13 tests
- Type validation: 12 tests
- ML service logic: 3 tests

### ⏳ Not Yet Implemented
- API endpoint tests
- End-to-end tests
- Load/performance tests

## Test Files Location

```
kisanmind/
├── api-server/
│   └── __tests__/
│       ├── visual-assessment-db.test.ts        (13 tests) ✅
│       └── ml-service-integration.test.ts      (skipped - needs ML service)
├── orchestrator/
│   └── __tests__/
│       └── visual-intelligence.test.ts         (12 tests) ✅
├── services/
│   └── ml-inference/
│       └── test_app.py                         (3 tests) ✅
└── tests/
    ├── visual-assessment-test-plan.md          (test plan)
    ├── visual-assessment-test-results.log      (execution log)
    ├── VISUAL-ASSESSMENT-TEST-SUMMARY.md       (summary)
    └── README.md                               (this file)
```

## Running ML Service Tests

The ML service integration tests require the FastAPI service to be running:

```bash
# Terminal 1: Start ML service
cd services/ml-inference
py -m uvicorn app:app --port 8100

# Terminal 2: Run integration tests
npm test -- api-server/__tests__/ml-service-integration.test.ts
```

## Test Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total Tests | 28 | ✅ |
| Pass Rate | 100% | ✅ |
| Avg Execution Time | 189ms/test | ✅ |
| Code Coverage | ~40% | ⚠️ |
| Database Coverage | 100% | ✅ |
| API Route Coverage | 0% | ❌ |

## Next Testing Priorities

1. **API Endpoint Tests** (High Priority)
   - Test all HTTP routes
   - Test error handling
   - Test multipart form uploads

2. **E2E Tests** (High Priority)
   - Complete farmer journey
   - Visual data in final report
   - Integration with orchestrator

3. **Performance Tests** (Medium Priority)
   - Concurrent uploads
   - Large images
   - Load testing

## Contributing Tests

When adding new tests:

1. ✅ Follow naming convention: `TC<number>: should X when Y`
2. ✅ Use AAA pattern (Arrange, Act, Assert)
3. ✅ Keep tests independent (no shared state)
4. ✅ Mock external dependencies
5. ✅ Include edge cases
6. ✅ Add performance assertions where relevant
7. ✅ Update test plan and summary documents

## Useful Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- path/to/test.ts

# Generate coverage report
npm test -- --coverage

# Run only failed tests
npm test -- --onlyFailures
```

## Test Environment

- **Node.js:** v20+
- **Jest:** 29.7.0
- **TypeScript:** 5.7.2
- **Python:** 3.12.0
- **Test Framework:** Jest + ts-jest + Python unittest

## Getting Help

- Review test plan: `tests/visual-assessment-test-plan.md`
- Check test results: `tests/visual-assessment-test-results.log`
- Read summary: `tests/VISUAL-ASSESSMENT-TEST-SUMMARY.md`
- Check agent memory: `.claude/agent-memory/test-runner/MEMORY.md`

---

**Last Updated:** 2026-02-13
**Maintained By:** Test Runner Agent
