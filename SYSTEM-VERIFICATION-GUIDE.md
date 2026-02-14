# KisanMind System Verification Guide

**Complete End-to-End System Testing Guide**

This guide walks you through starting and verifying the entire KisanMind system from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Architecture Overview](#system-architecture-overview)
3. [Starting the System](#starting-the-system)
4. [Verification Steps](#verification-steps)
5. [End-to-End Testing](#end-to-end-testing)
6. [Health Checks](#health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Shutdown Procedure](#shutdown-procedure)

---

## Prerequisites

### Required Software

- [x] **Node.js** (v18 or later)
- [x] **Python** 3.12+
- [x] **Git** (for version control)
- [x] **Text Editor/IDE** (VS Code recommended)

### Installation Verification

```bash
# Verify Node.js
node --version   # Should be v18.x or later
npm --version    # Should be 9.x or later

# Verify Python
py --version     # Should be 3.12.x or later
py -m pip --version

# Verify Git
git --version
```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install API server dependencies
cd api-server
npm install

# Install Frontend dependencies
cd ../frontend
npm install

# Install Orchestrator dependencies
cd ../orchestrator
npm install

# Install ML service dependencies
cd ../services/ml-inference
py -m pip install -r requirements.txt
py -m pip install protobuf==5.29.3  # Critical for TensorFlow 2.20

# Return to root
cd ../..
```

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Port 3000)                     │
│                   Next.js + React + Tailwind                 │
│                   User Interface Layer                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   API SERVER (Port 3001)                     │
│              Express + TypeScript + Firebase                 │
│           Session Management + Orchestration                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
┌─────────────────────────┐  ┌────────────────────────────────┐
│  ML SERVICE (Port 8100) │  │  ORCHESTRATOR (In-Process)     │
│  FastAPI + Python       │  │  Claude Opus 4.6 + Agents      │
│  Soil & Crop Analysis   │  │  Multi-Agent Coordination      │
└─────────────────────────┘  └────────────────────────────────┘
```

**Communication Flow:**
1. User interacts with Frontend (port 3000)
2. Frontend sends requests to API Server (port 3001)
3. API Server:
   - Forwards images to ML Service (port 8100)
   - Invokes Orchestrator for farming plan generation
4. Results flow back through API Server to Frontend

---

## Starting the System

### Step 1: Start ML Inference Service

**Terminal 1** - ML Service

```bash
cd services/ml-inference
py -m uvicorn app:app --port 8100 --reload
```

**Expected Output:**
```
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
[ML Service] Loading models...
[ML Service] Soil Analysis: Using intelligent heuristics (mock)
[ML Service] [WARNING] Disease model not loaded - using fallback
[ML Service] Model loading complete!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8100 (Press CTRL+C to quit)
```

**Verify ML Service:**
```bash
# In a new terminal
curl http://localhost:8100/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "ml-inference",
  "version": "2.0.0",
  "capabilities": [
    "soil-classification",
    "crop-disease-detection"
  ],
  "models": {
    "soil": "Intelligent heuristics (~70% accuracy)",
    "disease": "Heuristics fallback (color analysis)"
  }
}
```

✅ **ML Service is ready when you see "healthy" status**

---

### Step 2: Start API Server

**Terminal 2** - API Server

```bash
cd api-server
npm run dev
```

**Expected Output:**
```
> api-server@1.0.0 dev
> tsx --watch index.ts

[API] Initializing...
[API] Firebase Firestore enabled for persistent session storage
  OR
[API] Firebase unavailable -- using in-memory session storage
[API] Orchestrator module loaded successfully
========================================================
           KisanMind API Server
========================================================
Server running on http://localhost:3001
Health check: http://localhost:3001/health
Storage mode: Firestore (persistent) [or In-memory (fallback)]
Ready to serve farming recommendations!
========================================================
```

**Verify API Server:**
```bash
# In a new terminal
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-14T12:00:00.000Z",
  "orchestrator": "ready",
  "storage": "firestore"  // or "in-memory"
}
```

✅ **API Server is ready when "orchestrator: ready"**

---

### Step 3: Start Frontend

**Terminal 3** - Frontend

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
> frontend@0.1.0 dev
> next dev

   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 2.5s
 ○ Compiling / ...
 ✓ Compiled / in 3.2s
```

**Verify Frontend:**
```bash
# Open in browser
http://localhost:3000
```

**Expected Result:**
- Page loads successfully
- You see the KisanMind homepage/input form
- No console errors in browser developer tools (F12)

✅ **Frontend is ready when page loads without errors**

---

## Verification Steps

### 1. Service Health Checks

Run all health checks in sequence:

```bash
# ML Service Health
curl http://localhost:8100/health

# API Server Health
curl http://localhost:3001/health

# Frontend (check in browser)
# Open: http://localhost:3000
```

**All services should return "healthy" status**

---

### 2. Component-Level Testing

#### Test ML Service Endpoints

**Test Soil Analysis:**
```bash
# Create a test image (1x1 pixel black image)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==" | base64 -d > test_soil.png

# Test soil analysis
curl -X POST http://localhost:8100/analyze-soil \
  -F "image=@test_soil.png" \
  -F "latitude=20.9374" \
  -F "longitude=77.7796" \
  | python -m json.tool
```

**Expected Response:**
```json
{
  "status": "success",
  "analysis_type": "soil_classification",
  "processing_time_ms": 15,
  "result": {
    "soil_type": "Black Cotton Soil (Vertisol)",
    "confidence": 0.72,
    "texture": "clayey",
    "estimated_ph": 8.2,
    "suitable_crops": ["Cotton", "Soybean", ...],
    "image_analysis": {
      "brightness": 45.2,
      "redness_index": 0.89,
      ...
    }
  }
}
```

**Test Crop Analysis:**
```bash
# Test crop disease detection
curl -X POST http://localhost:8100/analyze-crop \
  -F "image=@test_soil.png" \
  -F "crop_name=cotton" \
  | python -m json.tool
```

**Expected Response:**
```json
{
  "status": "success",
  "analysis_type": "crop_health",
  "result": {
    "health_score": 0.85,
    "assessment": "Crop appears healthy...",
    "detected_diseases": [],
    "image_analysis": { ... }
  }
}
```

✅ **ML Service is working if both endpoints return success**

---

#### Test API Server Endpoints

**Test Visual Assessment:**
```bash
# Test visual assessment endpoint
curl -X POST http://localhost:3001/api/visual-assessment \
  -F "soilImages=@test_soil.png" \
  -F "sessionId=test-session-$(date +%s)" \
  | python -m json.tool
```

**Expected Response:**
```json
{
  "status": "success",
  "assessmentId": "va-...",
  "sessionId": "test-session-...",
  "analysisType": "soil",
  "soil": {
    "type": "Black Cotton Soil (Vertisol)",
    "confidence": 0.72,
    ...
  }
}
```

**Test Farming Plan Endpoint:**
```bash
# Test farming plan creation
curl -X POST http://localhost:3001/api/farming-plan \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "address": "Vidarbha, Maharashtra"
    },
    "landSize": 3,
    "waterSource": "borewell",
    "previousCrops": ["cotton"],
    "budget": 50000
  }' \
  | python -m json.tool
```

**Expected Response:**
```json
{
  "sessionId": "session-...",
  "hasVisualData": false
}
```

**Poll for Results:**
```bash
# Replace SESSION_ID with the one from previous response
curl http://localhost:3001/api/farming-plan/SESSION_ID | python -m json.tool
```

**Expected Response (when processing):**
```json
{
  "status": "processing",
  "agentStatuses": [
    {"name": "Ground Analyzer", "status": "running", "progress": 50},
    {"name": "Water Assessor", "status": "completed", "progress": 100},
    ...
  ]
}
```

**Expected Response (when completed):**
```json
{
  "status": "completed",
  "synthesis": {
    "recommendedCrop": {
      "name": "Soybean",
      "variety": "JS 335",
      "profitEstimate": 45000
    },
    "sowingDetails": { ... },
    "waterManagement": { ... },
    ...
  }
}
```

✅ **API Server is working if farming plan completes successfully**

---

### 3. Frontend Testing

Open browser to `http://localhost:3000` and verify:

#### Homepage Tests
- [ ] Page loads without errors
- [ ] Input form is visible
- [ ] All form fields are present:
  - Location input
  - Land size
  - Water source dropdown
  - Previous crops
  - Budget input
- [ ] Submit button is clickable

#### Form Submission Test
1. Fill out the form:
   - **Location**: "Vidarbha, Maharashtra"
   - **Land Size**: 3 acres
   - **Water Source**: Borewell
   - **Previous Crops**: Cotton
   - **Budget**: 50000

2. Click "Get Farming Plan" or similar button

3. **Expected Behavior:**
   - Loading spinner appears
   - Progress indicators show agent statuses
   - After 30-60 seconds, results appear
   - Results show:
     - Recommended crop
     - Sowing details
     - Water management plan
     - Market strategy
     - Government schemes
     - Risk warnings
     - Monthly action plan

✅ **Frontend is working if complete flow succeeds**

---

## End-to-End Testing

### Complete User Journey Test

**Scenario**: Farmer in Vidarbha wants crop recommendation

**Steps:**

1. **Upload Images (Optional)**
   - Navigate to image upload section
   - Upload soil image
   - Upload crop image
   - Verify ML analysis results appear

2. **Fill Farmer Input Form**
   ```
   Location: Vidarbha, Maharashtra
   Land Size: 3 acres
   Water Source: Borewell
   Previous Crops: Cotton
   Budget: ₹50,000
   ```

3. **Submit Form**
   - Click submit button
   - Observe agent progress indicators

4. **View Results**
   - Wait for completion (30-60 seconds)
   - Verify all sections appear:
     - ✓ Recommended Crop
     - ✓ Sowing Details
     - ✓ Water Management
     - ✓ Selling Strategy
     - ✓ Government Schemes
     - ✓ Risk Warnings
     - ✓ Action Plan

5. **Verify Data Quality**
   - Crop recommendation is relevant to region
   - Profit estimates are reasonable
   - Water requirements match source type
   - Government schemes are real/valid
   - Action plan is month-by-month

✅ **System passes E2E test if all steps complete successfully**

---

## Health Checks

### Automated Health Check Script

Create a file `check-health.sh`:

```bash
#!/bin/bash

echo "======================================"
echo "KisanMind System Health Check"
echo "======================================"
echo ""

# Check ML Service
echo "[1/3] ML Inference Service..."
ML_STATUS=$(curl -s http://localhost:8100/health | grep -o '"status":"healthy"')
if [ "$ML_STATUS" ]; then
  echo "  ✓ ML Service: HEALTHY"
else
  echo "  ✗ ML Service: DOWN"
fi

# Check API Server
echo "[2/3] API Server..."
API_STATUS=$(curl -s http://localhost:3001/health | grep -o '"status":"healthy"')
if [ "$API_STATUS" ]; then
  echo "  ✓ API Server: HEALTHY"
else
  echo "  ✗ API Server: DOWN"
fi

# Check Frontend
echo "[3/3] Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "  ✓ Frontend: HEALTHY"
else
  echo "  ✗ Frontend: DOWN"
fi

echo ""
echo "======================================"
```

**Run Health Checks:**
```bash
bash check-health.sh
```

**Expected Output:**
```
======================================
KisanMind System Health Check
======================================

[1/3] ML Inference Service...
  ✓ ML Service: HEALTHY
[2/3] API Server...
  ✓ API Server: HEALTHY
[3/3] Frontend...
  ✓ Frontend: HEALTHY

======================================
```

---

## Troubleshooting

### Issue 1: ML Service Won't Start

**Symptoms:**
- `ModuleNotFoundError: No module named 'fastapi'`
- `ImportError: cannot import name 'runtime_version' from 'google.protobuf'`

**Solutions:**
```bash
cd services/ml-inference

# Reinstall dependencies
py -m pip install -r requirements.txt

# Fix protobuf issue
py -m pip install protobuf==5.29.3

# Verify TensorFlow loads
py -c "import tensorflow as tf; print(tf.__version__)"

# Restart service
py -m uvicorn app:app --port 8100 --reload
```

---

### Issue 2: API Server Can't Connect to ML Service

**Symptoms:**
- API returns "ML service unavailable"
- 503 errors when uploading images

**Solutions:**
```bash
# Verify ML service is running
curl http://localhost:8100/health

# Check if port 8100 is in use
netstat -ano | grep :8100

# Restart ML service on correct port
cd services/ml-inference
py -m uvicorn app:app --port 8100 --reload

# Check API server environment variables
cd api-server
cat .env | grep ML_SERVICE_URL
# Should be: ML_SERVICE_URL=http://localhost:8100
```

---

### Issue 3: Frontend Can't Connect to API Server

**Symptoms:**
- CORS errors in browser console
- "Network Error" when submitting form
- API requests fail with 404

**Solutions:**
```bash
# Check API server is running
curl http://localhost:3001/health

# Verify frontend environment variables
cd frontend
cat .env.local | grep NEXT_PUBLIC_API_URL
# Should be: NEXT_PUBLIC_API_URL=http://localhost:3001

# Restart both services
# Terminal 1
cd api-server
npm run dev

# Terminal 2
cd frontend
npm run dev
```

---

### Issue 4: Orchestrator Fails to Generate Plan

**Symptoms:**
- Session stays in "processing" forever
- Error: "Orchestrator not initialized"
- Agent statuses show errors

**Solutions:**
```bash
# Check API server logs for orchestrator errors
cd api-server
# Look for "[API] Orchestrator module loaded successfully"

# Verify orchestrator is built
cd ../orchestrator
npm run build

# Check for .env file with Claude API key
cd ../api-server
cat .env | grep ANTHROPIC_API_KEY
# Should have valid API key

# Restart API server
npm run dev
```

---

### Issue 5: Firebase/Firestore Errors

**Symptoms:**
- "Firebase unavailable" messages
- Sessions not persisting
- Data loss on restart

**Solutions:**
```bash
# Check Firebase credentials
cd api-server
ls -la firebase-credentials.json
# File should exist

# Verify Firebase is enabled in .env
cat .env | grep FIREBASE
# Should have FIREBASE_PROJECT_ID and FIREBASE_CREDENTIALS

# Check API server logs
# Should see: "Firebase Firestore enabled for persistent session storage"

# If Firebase is optional, system will use in-memory fallback
# No action needed if you see: "Firebase unavailable -- using in-memory"
```

---

### Issue 6: Port Already in Use

**Symptoms:**
- "Error: listen EADDRINUSE"
- "Address already in use"

**Solutions:**

**Windows:**
```bash
# Find process using port
netstat -ano | findstr :3000   # Frontend
netstat -ano | findstr :3001   # API Server
netstat -ano | findstr :8100   # ML Service

# Kill process by PID
taskkill /F /PID <PID>
```

**Linux/Mac:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9   # Frontend
lsof -ti:3001 | xargs kill -9   # API Server
lsof -ti:8100 | xargs kill -9   # ML Service
```

---

## Shutdown Procedure

### Graceful Shutdown

**Step 1: Stop Frontend**
- In Terminal 3 (Frontend), press `Ctrl+C`
- Wait for "shutdown" message

**Step 2: Stop API Server**
- In Terminal 2 (API Server), press `Ctrl+C`
- Wait for cleanup to complete

**Step 3: Stop ML Service**
- In Terminal 1 (ML Service), press `Ctrl+C`
- Wait for uvicorn to shut down

**Verify All Services Stopped:**
```bash
# Check no services responding
curl http://localhost:3000  # Should fail
curl http://localhost:3001/health  # Should fail
curl http://localhost:8100/health  # Should fail
```

---

## Quick Start Checklist

Use this checklist for rapid startup:

```
□ Install all dependencies (npm install, pip install)
□ Set up environment variables (.env files)
□ Start ML service (Terminal 1: py -m uvicorn app:app --port 8100 --reload)
□ Verify ML health: curl http://localhost:8100/health
□ Start API server (Terminal 2: cd api-server && npm run dev)
□ Verify API health: curl http://localhost:3001/health
□ Start frontend (Terminal 3: cd frontend && npm run dev)
□ Open browser: http://localhost:3000
□ Test image upload
□ Test farming plan generation
□ Verify end-to-end flow works
```

---

## Performance Benchmarks

Expected performance for a healthy system:

| Metric | Expected Value | Notes |
|--------|---------------|-------|
| ML Service Response Time | < 20ms | Soil/crop analysis |
| API Server Response Time | < 100ms | Simple requests |
| Farming Plan Generation | 30-90s | Full orchestrator run |
| Frontend Page Load | < 2s | Initial load |
| Image Upload + Analysis | < 5s | Single image |
| Complete E2E Flow | 45-120s | Input to final report |

---

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 2 GB free space
- **Network**: Internet connection (for API calls)

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8 GB
- **Disk**: 5 GB free space
- **Network**: Stable broadband connection

---

## Success Criteria

System is fully operational when:

- ✅ All 3 services start without errors
- ✅ All health checks return "healthy"
- ✅ ML service analyzes images in < 20ms
- ✅ API server processes requests successfully
- ✅ Frontend loads and displays correctly
- ✅ End-to-end farming plan generation completes
- ✅ No console errors in browser or terminals
- ✅ Test data flows through all layers

---

## Next Steps After Verification

Once system is verified working:

1. **Run Test Suite**
   ```bash
   # Run all tests
   npm test
   ```

2. **Review Test Reports**
   - Check `TEST-FIXES-SUMMARY.md`
   - Review `ML-INTEGRATION-TEST-REPORT.md`

3. **Deploy to Staging**
   - Follow deployment guides
   - Configure production environment

4. **Monitor Production**
   - Set up logging
   - Configure alerts
   - Monitor performance metrics

---

**System Verification Complete!** 🎉

If all checks pass, your KisanMind system is fully operational and ready for use or deployment.

---

**Document Version**: 1.0
**Last Updated**: February 14, 2026
**Maintained By**: KisanMind Team
