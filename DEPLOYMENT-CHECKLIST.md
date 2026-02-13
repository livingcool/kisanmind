# KisanMind Deployment Checklist

Use this checklist to track your deployment progress.

## 📋 Pre-Deployment

- [ ] Latest code pushed to GitHub
- [ ] Firebase project created
- [ ] Firebase Firestore database enabled
- [ ] Firebase service account credentials downloaded
- [ ] Anthropic API key ready
- [ ] Render account created
- [ ] Vercel account created

## 🔥 Firebase Setup

- [ ] Service account JSON downloaded
- [ ] Base64 encoded service account OR individual credentials extracted
- [ ] Credentials saved securely (do not commit to git!)

## 🚀 Deployment Steps

### Step 1: ML Inference Service
- [ ] Created web service on Render
- [ ] Configured Python runtime
- [ ] Set root directory: `services/ml-inference`
- [ ] Environment variable `PYTHON_VERSION=3.11` added
- [ ] Service deployed successfully
- [ ] Health check passes: `curl https://kisanmind-ml-service.onrender.com/health`
- [ ] Noted ML service URL: `____________________________`

### Step 2: API Server
- [ ] Created web service on Render
- [ ] Configured Node runtime
- [ ] Build command configured
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`
  - [ ] `ANTHROPIC_API_KEY=sk-ant-...`
  - [ ] `ML_SERVICE_URL=https://kisanmind-ml-service.onrender.com`
  - [ ] `FRONTEND_URL` (will update after Vercel)
  - [ ] Firebase credentials (Option 1 OR Option 2)
- [ ] Service deployed successfully
- [ ] Health check shows `storage: "firestore"`: `curl https://kisanmind-api.onrender.com/health`
- [ ] Noted API server URL: `____________________________`

### Step 3: Frontend
- [ ] Connected repository to Vercel
- [ ] Set root directory: `frontend`
- [ ] Environment variables set:
  - [ ] `NEXT_PUBLIC_API_URL=https://kisanmind-api.onrender.com`
  - [ ] `NEXT_PUBLIC_ML_SERVICE_URL=https://kisanmind-ml-service.onrender.com`
- [ ] Frontend deployed successfully
- [ ] Noted frontend URL: `____________________________`
- [ ] Updated API server `FRONTEND_URL` with Vercel URL
- [ ] API server redeployed with new CORS settings

## ✅ Testing

### Service Health Checks
- [ ] ML service health check passes
- [ ] API server health check shows Firestore enabled
- [ ] Frontend loads successfully

### Visual Assessment Flow
- [ ] Camera access works
- [ ] Can capture soil images
- [ ] Can capture crop images
- [ ] Images upload to ML service
- [ ] Quality overlay shows feedback

### Farming Plan Flow
- [ ] Can enter location
- [ ] Can enter land details
- [ ] "Get Recommendations" button works
- [ ] Progress updates show agent statuses
- [ ] Final report displays correctly
- [ ] Report includes visual intelligence data (if images uploaded)

### Firebase Persistence
- [ ] Session created in Firestore
- [ ] Session status updates in Firestore
- [ ] Completed session persists in Firestore
- [ ] Can retrieve session after API server restart

### End-to-End Test
- [ ] Complete farmer input form
- [ ] Upload 4 images via camera
- [ ] Submit farming plan request
- [ ] Wait for AI analysis
- [ ] Verify report shows:
  - [ ] Recommended crop with profit estimate
  - [ ] Sowing details
  - [ ] Water management
  - [ ] Selling strategy
  - [ ] Government schemes
  - [ ] Risk warnings
  - [ ] Monthly action plan

## 🔐 Security

- [ ] All API keys in environment variables (not in code)
- [ ] CORS configured correctly
- [ ] Firebase security rules reviewed
- [ ] HTTPS enabled (automatic)
- [ ] No sensitive data in logs

## 📊 Monitoring

- [ ] Render logs accessible
- [ ] Vercel logs accessible
- [ ] Firebase Console accessible
- [ ] Set up uptime monitoring (optional)

## 📝 Documentation

- [ ] Production URLs documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide reviewed
- [ ] Team notified of deployment

---

## 🎯 Success Criteria

Deployment is successful when:

✅ All three services are live and responding to health checks
✅ Frontend can communicate with API server
✅ API server can communicate with ML service
✅ Firebase Firestore is storing sessions persistently
✅ Visual assessment feature works end-to-end
✅ Farming recommendations are generated successfully
✅ Multi-language support works
✅ Government schemes are displayed

---

## 📞 If Something Goes Wrong

1. **Check Render logs** for each service
2. **Check Vercel function logs** for frontend errors
3. **Check Firebase Console** for database issues
4. **Review RENDER-DEPLOYMENT-STEPS.md** troubleshooting section
5. **Test each service independently** before end-to-end testing

---

**Date**: 2026-02-13
**Deployment Started**: _______________
**Deployment Completed**: _______________
