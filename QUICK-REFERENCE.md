# KisanMind Quick Reference Card

**One-page reference for common tasks**

---

## 🚀 Start System

```bash
# Automated (recommended)
bash start-system.sh        # Linux/Mac
start-system.bat            # Windows

# Manual
# Terminal 1: cd services/ml-inference && py -m uvicorn app:app --port 8100
# Terminal 2: cd api-server && npm run dev
# Terminal 3: cd frontend && npm run dev
```

---

## 🛑 Stop System

```bash
bash stop-system.sh         # Automated
# OR press Ctrl+C in each terminal
```

---

## ✅ Health Check

```bash
bash check-health.sh
# OR
curl http://localhost:8100/health
curl http://localhost:3001/health
curl http://localhost:3000
```

---

## 🧪 Run Tests

```bash
npm test                    # All tests
cd api-server && npm test   # API tests
cd orchestrator && npm test # Orchestrator tests
```

---

## 🌐 Service URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API Server** | http://localhost:3001 |
| **ML Service** | http://localhost:8100 |

---

## 🔧 Quick Fixes

### Port in Use
```bash
# Linux/Mac
lsof -ti:8100 | xargs kill -9

# Windows
netstat -ano | findstr :8100
taskkill /F /PID <PID>
```

### ML Service Won't Start
```bash
cd services/ml-inference
py -m pip install -r requirements.txt
py -m pip install protobuf==5.29.3
```

### API Can't Connect to ML
```bash
# Check ML service
curl http://localhost:8100/health
# Check .env
cat api-server/.env | grep ML_SERVICE_URL
```

---

## 📚 Documentation

| Need | Document |
|------|----------|
| **Quick Start** | SYSTEM-STARTUP-README.md |
| **Full Guide** | SYSTEM-VERIFICATION-GUIDE.md |
| **Overview** | COMPLETE-INTEGRATION-SUMMARY.md |
| **Test Fixes** | TEST-FIXES-SUMMARY.md |
| **All Docs** | DOCUMENTATION-INDEX.md |

---

## 🎯 Expected Performance

| Metric | Target |
|--------|--------|
| ML Response | < 20ms |
| API Response | < 100ms |
| Plan Generation | 30-90s |
| Frontend Load | < 2s |

---

## ✨ Success Criteria

- ✅ All services start without errors
- ✅ Health checks return "healthy"
- ✅ Frontend loads at localhost:3000
- ✅ Image upload works
- ✅ Farming plan completes

---

**Version 1.0 | February 14, 2026**
