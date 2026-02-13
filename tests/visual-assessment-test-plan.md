# Visual Assessment Feature - Comprehensive Test Plan

**Feature:** Video-based Land Assessment with ML Inference
**Date:** 2026-02-13
**Status:** Ready for Execution

---

## Overview

This test plan covers the newly implemented visual assessment feature that allows farmers to upload images of their soil and crops for ML-based analysis. The feature integrates a Python FastAPI ML inference service with the Node.js API server and orchestrator.

## Architecture Components Under Test

### 1. ML Inference Service (`services/ml-inference/app.py`)
- FastAPI service running on port 8100
- Endpoints: `/analyze-soil`, `/analyze-crop`, `/health`
- Image analysis using PIL and heuristic-based classification

### 2. Visual Assessment Database (`api-server/visual-assessment-db.ts`)
- In-memory storage for assessment results
- CRUD operations for visual assessments
- Session-based indexing and retrieval

### 3. API Routes (`api-server/visual-assessment-routes.ts`)
- REST endpoints for image upload and retrieval
- Integration with ML service
- Error handling and fallback behavior

### 4. Orchestrator Integration (`orchestrator/orchestrator.ts`, `orchestrator/synthesis-agent.ts`)
- Modified to accept visual intelligence as 6th data source
- Synthesis agent combines visual + satellite data

---

## Test Categories

### Category 1: ML Service Unit Tests ✅ (Already Passing)
**Location:** `services/ml-inference/test_app.py`
**Status:** 3/3 tests passing
**Coverage:**
- Soil classification with different colored images
- Crop health analysis
- Deterministic results for same input

### Category 2: ML Service Integration Tests
**Location:** `tests/visual-assessment/ml-service-integration.test.ts`
**Purpose:** Test the ML service via HTTP endpoints with real images

#### Test Cases:
1. **POST /analyze-soil with various image types**
   - TC2.1: Dark image → Black Cotton Soil classification
   - TC2.2: Red image → Red Soil classification
   - TC2.3: Bright image → Sandy Loam classification
   - TC2.4: Invalid image format → 400 error
   - TC2.5: Empty file → 400 error
   - TC2.6: Oversized file (>20MB) → 400 error

2. **POST /analyze-crop with various image types**
   - TC2.7: Green image → Healthy crop assessment
   - TC2.8: Brown image → Disease detection
   - TC2.9: White patches → Powdery mildew detection
   - TC2.10: Invalid image → 400 error

3. **GET /health endpoint**
   - TC2.11: Health check returns service status

4. **Response validation**
   - TC2.12: Soil response contains required fields
   - TC2.13: Crop response contains required fields
   - TC2.14: Confidence scores are within valid range (0.6-0.96)

**Expected Results:**
- All image analysis requests complete in <1000ms
- Confidence scores are consistent for same image
- Different images produce different classifications
- Error responses have clear messages

---

### Category 3: API Endpoint Tests
**Location:** `tests/visual-assessment/api-endpoints.test.ts`
**Purpose:** Test the Express API routes with mocked ML service

#### Test Cases:
1. **POST /api/visual-assessment**
   - TC3.1: Upload soil images only → Returns soil analysis
   - TC3.2: Upload crop images only → Returns crop analysis
   - TC3.3: Upload both soil and crop → Returns both analyses
   - TC3.4: Missing sessionId → 400 error
   - TC3.5: No images provided → 400 error
   - TC3.6: ML service unavailable → 503 error with helpful message
   - TC3.7: Valid upload with GPS coordinates → Stored with location
   - TC3.8: Upload with crop name → Passed to ML service

2. **GET /api/visual-assessment/:id**
   - TC3.9: Valid ID → Returns assessment details
   - TC3.10: Invalid ID → 404 error

3. **GET /api/visual-assessment/session/:sessionId**
   - TC3.11: Session with assessments → Returns all assessments
   - TC3.12: Session with no assessments → Returns empty array

4. **GET /api/visual-assessment/session/:sessionId/latest**
   - TC3.13: Session with assessments → Returns latest in VisualIntelligence format
   - TC3.14: Session with no assessments → Returns null with hasVisualData: false

**Expected Results:**
- API handles multipart form data correctly
- Session indexing works properly
- VisualIntelligence conversion is accurate
- Error messages are actionable

---

### Category 4: Database Tests
**Location:** `tests/visual-assessment/database.test.ts`
**Purpose:** Test the in-memory database operations

#### Test Cases:
1. **Storage Operations**
   - TC4.1: Store assessment → Retrievable by ID
   - TC4.2: Store multiple assessments → All retrievable
   - TC4.3: Store with same sessionId → Session index updated

2. **Retrieval Operations**
   - TC4.4: Get assessment by ID → Returns correct data
   - TC4.5: Get non-existent ID → Returns null
   - TC4.6: Get session assessments → Returns all for session
   - TC4.7: Get latest assessment → Returns most recent

3. **Cleanup Operations**
   - TC4.8: Cleanup old assessments (>1 hour) → Removes expired
   - TC4.9: Cleanup updates session index → Removes stale references

4. **Type Conversion**
   - TC4.10: toVisualIntelligence() → Converts to orchestrator format
   - TC4.11: Conversion preserves all critical data
   - TC4.12: Conversion handles null soil/crop data

**Expected Results:**
- All CRUD operations work correctly
- Session indexing is consistent
- Cleanup doesn't affect recent assessments
- Type conversion is lossless

---

### Category 5: Orchestrator Integration Tests
**Location:** `tests/visual-assessment/orchestrator-integration.test.ts`
**Purpose:** Test orchestrator with visual intelligence data

#### Test Cases:
1. **Orchestrator with Visual Data**
   - TC5.1: Orchestrator receives visual intelligence → Included in aggregated data
   - TC5.2: Orchestrator without visual data → Works normally (backward compatible)
   - TC5.3: Visual soil data matches satellite → Synthesis agent notes agreement
   - TC5.4: Visual soil data conflicts with satellite → Synthesis agent notes conflict

2. **Synthesis Agent**
   - TC5.5: Synthesis prompt includes visual data when available
   - TC5.6: Synthesis output references visual findings
   - TC5.7: Synthesis combines visual + satellite for better accuracy

3. **Error Scenarios**
   - TC5.8: Partial visual data (soil only) → Orchestrator handles gracefully
   - TC5.9: Low confidence visual data → Synthesis treats as supplementary
   - TC5.10: Visual data contradicts all satellite sources → Synthesis flags uncertainty

**Expected Results:**
- Visual data flows correctly through orchestrator
- Synthesis agent uses visual data when making recommendations
- System degrades gracefully without visual data
- Conflicting data is handled intelligently

---

### Category 6: End-to-End Tests
**Location:** `tests/visual-assessment/e2e.test.ts`
**Purpose:** Test the complete farmer journey with visual assessment

#### Test Cases:
1. **Complete Flow: Soil Assessment**
   - TC6.1: Upload soil images → Get assessment → Pass to orchestrator → Get farming plan
   - TC6.2: Verify soil type appears in synthesis output
   - TC6.3: Verify nutrient recommendations appear

2. **Complete Flow: Crop Assessment**
   - TC6.4: Upload crop images → Detect disease → Get treatment plan
   - TC6.5: Verify disease treatment in synthesis output

3. **Complete Flow: Both**
   - TC6.6: Upload both soil + crop → Get comprehensive analysis
   - TC6.7: Verify both soil and crop data in final report

4. **Real-World Scenarios**
   - TC6.8: Vidarbha farmer, black soil, failed cotton → System recommends alternative
   - TC6.9: Visual assessment confirms satellite soil type → Higher confidence output
   - TC6.10: Visual assessment shows crop disease → Synthesis prioritizes treatment

**Expected Results:**
- Complete flows execute without errors
- Visual findings appear in final farmer report
- Response times are acceptable (<10s for full flow)
- Output is actionable and clear

---

## Test Data

### Test Images (Programmatically Generated)
1. **Soil Images:**
   - `black-soil.png` - RGB(30, 25, 20) - Black Cotton Soil
   - `red-soil.png` - RGB(180, 80, 60) - Red Soil
   - `sandy-soil.png` - RGB(220, 210, 180) - Sandy Loam
   - `alluvial-soil.png` - RGB(140, 130, 100) - Alluvial Soil

2. **Crop Images:**
   - `healthy-crop.png` - RGB(50, 160, 50) - Healthy green
   - `diseased-crop.png` - RGB(150, 90, 50) - Brown patches (Leaf Blight)
   - `mildew-crop.png` - RGB(230, 230, 225) - White patches (Powdery Mildew)
   - `rust-crop.png` - RGB(180, 80, 50) - Orange-red (Rust)

3. **Invalid Images:**
   - `empty.png` - 0 bytes
   - `corrupted.png` - Invalid PNG data
   - `oversized.png` - >20MB file

### Test Farmer Profile (Vidarbha, Maharashtra)
```json
{
  "location": {
    "latitude": 20.9,
    "longitude": 77.75,
    "state": "Maharashtra",
    "district": "Vidarbha"
  },
  "landSize": { "acres": 3 },
  "waterSource": "borewell",
  "currentCrops": [],
  "previousCrops": ["cotton"],
  "language": "en"
}
```

---

## Test Environment Setup

### Prerequisites:
1. **ML Service Running:**
   ```bash
   cd services/ml-inference
   python -m uvicorn app:app --port 8100
   ```

2. **Dependencies Installed:**
   ```bash
   npm install
   cd services/ml-inference && pip install -r requirements.txt
   ```

3. **Environment Variables:**
   ```
   ML_SERVICE_URL=http://localhost:8100
   ANTHROPIC_API_KEY=<your-key>
   ```

### Test Execution:
```bash
# Run all visual assessment tests
npm test -- --testPathPattern=visual-assessment

# Run specific category
npm test -- tests/visual-assessment/ml-service-integration.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern=visual-assessment

# Watch mode for development
npm test -- --watch --testPathPattern=visual-assessment
```

---

## Success Criteria

### Functional Requirements:
- ✅ All test categories have >90% pass rate
- ✅ ML service responds within 1s for single image
- ✅ API endpoints handle all error cases gracefully
- ✅ Orchestrator successfully integrates visual data
- ✅ End-to-end flows complete without errors

### Performance Requirements:
- ✅ ML inference: <1000ms per image
- ✅ API upload + storage: <2000ms
- ✅ Full orchestrator run with visual data: <30s
- ✅ Database operations: <10ms

### Quality Requirements:
- ✅ Code coverage >80% for new files
- ✅ All TypeScript types are correct
- ✅ No ESLint errors
- ✅ All error cases have clear messages

---

## Known Limitations & Future Work

### Current Limitations:
1. **Mock ML Models:** Using heuristic-based classification instead of real ML models
   - Post-hackathon: Replace with fine-tuned EfficientNet/YOLOv8
2. **In-Memory Storage:** Assessments don't persist across restarts
   - Post-hackathon: Migrate to Firestore or SQLite
3. **Single Image Analysis:** Only analyzes first image when multiple uploaded
   - Post-hackathon: Average results from multiple images
4. **No Image Preprocessing:** No rotation correction, quality checks
   - Post-hackathon: Add EXIF orientation handling, quality validation

### Test Coverage Gaps:
1. **Performance Testing:** Need load tests with concurrent uploads
2. **Security Testing:** Need tests for malicious file uploads
3. **Mobile Testing:** Need tests with actual mobile-captured images
4. **Language Testing:** Need tests for Hindi/Marathi output

---

## Test Execution Log

See `visual-assessment-test-results.log` for detailed execution logs with timestamps, pass/fail status, and performance metrics.

---

## Appendix A: API Schemas

### POST /api/visual-assessment Request:
```
Content-Type: multipart/form-data

Fields:
- soilImages[]: File[] (optional)
- cropImages[]: File[] (optional)
- sessionId: string (required)
- latitude: number (optional)
- longitude: number (optional)
- cropName: string (optional)
```

### POST /api/visual-assessment Response:
```json
{
  "status": "success",
  "assessmentId": "va-1234567890-abc123",
  "sessionId": "session-xyz",
  "analysisType": "both",
  "processingTime_ms": 1234,
  "overallConfidence": 0.85,
  "soil": { ... },
  "crop": { ... }
}
```

---

**Test Plan Version:** 1.0
**Last Updated:** 2026-02-13
**Next Review:** After test execution completion
