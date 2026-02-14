# KisanMind System Startup & Verification

**Quick reference for starting and verifying the complete KisanMind system**

---

## Quick Start

### Option 1: Automated Startup (Recommended)

**Linux/Mac:**
```bash
bash start-system.sh
```

**Windows:**
```batch
start-system.bat
```

This will automatically:
- Check prerequisites
- Verify ports are available
- Start all services in order
- Wait for each service to be ready
- Open your browser to the application

---

### Option 2: Manual Startup

**Terminal 1 - ML Service:**
```bash
cd services/ml-inference
py -m uvicorn app:app --port 8100 --reload
```

**Terminal 2 - API Server:**
```bash
cd api-server
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Verify System Health

```bash
bash check-health.sh
```

Expected output:
```
======================================
  KisanMind System Health Check
======================================

[1/3] ML Inference Service (Port 8100)
  ✓ ML Service is running (HTTP 200)
  ✓ Status: healthy

[2/3] API Server (Port 3001)
  ✓ API Server is running (HTTP 200)
  ✓ Status: healthy

[3/3] Frontend (Port 3000)
  ✓ Frontend is running (HTTP 200)

======================================
  Summary
======================================

  ✓ ML Service: OPERATIONAL
  ✓ API Server: OPERATIONAL
  ✓ Frontend: OPERATIONAL

======================================
  ✓ System Status: ALL SERVICES OPERATIONAL

Access the application at:
  http://localhost:3000
```

---

## Stop System

```bash
bash stop-system.sh
```

Or press `Ctrl+C` in each terminal window.

---

## Service Endpoints

| Service | Port | URL | Health Check |
|---------|------|-----|--------------|
| **ML Service** | 8100 | http://localhost:8100 | http://localhost:8100/health |
| **API Server** | 3001 | http://localhost:3001 | http://localhost:3001/health |
| **Frontend** | 3000 | http://localhost:3000 | http://localhost:3000 |

---

## Testing the System

### 1. Quick Health Check
```bash
curl http://localhost:8100/health
curl http://localhost:3001/health
curl http://localhost:3000
```

### 2. Test ML Service
```bash
# Test soil analysis
curl -X POST http://localhost:8100/analyze-soil \
  -F "image=@path/to/soil_image.jpg"

# Test crop analysis
curl -X POST http://localhost:8100/analyze-crop \
  -F "image=@path/to/crop_image.jpg" \
  -F "crop_name=cotton"
```

### 3. Test API Server
```bash
# Test farming plan endpoint
curl -X POST http://localhost:3001/api/farming-plan \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"address": "Vidarbha, Maharashtra"},
    "landSize": 3,
    "waterSource": "borewell",
    "previousCrops": ["cotton"],
    "budget": 50000
  }'
```

### 4. Test Frontend
1. Open http://localhost:3000 in browser
2. Fill out the farmer input form
3. Submit and verify results appear

---

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Database tests
cd api-server
npm test -- __tests__/visual-assessment-db.test.ts

# ML service integration tests
npm test -- __tests__/ml-service-integration.test.ts

# API endpoint tests
npm test -- __tests__/video-guidance-routes.test.ts

# Orchestrator tests
cd ../orchestrator
npm test -- __tests__/visual-intelligence.test.ts
```

---

## Troubleshooting

### ML Service Won't Start
```bash
cd services/ml-inference
py -m pip install -r requirements.txt
py -m pip install protobuf==5.29.3
py -m uvicorn app:app --port 8100 --reload
```

### API Server Can't Connect to ML Service
1. Verify ML service is running: `curl http://localhost:8100/health`
2. Check `.env` file has: `ML_SERVICE_URL=http://localhost:8100`
3. Restart API server

### Frontend Shows Errors
1. Check browser console (F12)
2. Verify API server is running: `curl http://localhost:3001/health`
3. Check `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:3001`
4. Restart frontend

### Port Already in Use
**Windows:**
```batch
netstat -ano | findstr :8100
taskkill /F /PID <PID>
```

**Linux/Mac:**
```bash
lsof -ti:8100 | xargs kill -9
```

---

## Documentation

- **[SYSTEM-VERIFICATION-GUIDE.md](./SYSTEM-VERIFICATION-GUIDE.md)** - Complete verification guide with detailed steps
- **[TEST-FIXES-SUMMARY.md](./TEST-FIXES-SUMMARY.md)** - Summary of test fixes applied
- **[ML-SERVICE-INTEGRATION-COMPLETE.md](./ML-SERVICE-INTEGRATION-COMPLETE.md)** - ML service integration status
- **[ML-INTEGRATION-TEST-REPORT.md](./ML-INTEGRATION-TEST-REPORT.md)** - Comprehensive test report

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `start-system.sh` | Start all services (Linux/Mac) |
| `start-system.bat` | Start all services (Windows) |
| `stop-system.sh` | Stop all services (Linux/Mac) |
| `check-health.sh` | Check service health (Linux/Mac) |

---

## System Requirements

### Minimum
- CPU: 2 cores
- RAM: 4 GB
- Disk: 2 GB free
- Network: Internet connection

### Recommended
- CPU: 4+ cores
- RAM: 8 GB
- Disk: 5 GB free
- Network: Stable broadband

---

## Success Criteria

System is operational when:
- ✅ All 3 services start without errors
- ✅ All health checks return "healthy"
- ✅ ML service responds in < 20ms
- ✅ Frontend loads correctly
- ✅ End-to-end flow completes successfully

---

## Quick Commands Reference

```bash
# Start system
bash start-system.sh                    # Linux/Mac
start-system.bat                        # Windows

# Check health
bash check-health.sh

# Stop system
bash stop-system.sh

# Run tests
npm test

# Check individual services
curl http://localhost:8100/health       # ML Service
curl http://localhost:3001/health       # API Server
curl http://localhost:3000              # Frontend

# View logs (if using automation scripts)
tail -f services/ml-inference/ml-service.log
tail -f api-server/api-server.log
tail -f frontend/frontend.log
```

---

## Support

For issues or questions:
1. Check [SYSTEM-VERIFICATION-GUIDE.md](./SYSTEM-VERIFICATION-GUIDE.md)
2. Review service logs
3. Run health checks
4. Verify prerequisites are installed

---

**Last Updated:** February 14, 2026
**Version:** 1.0
