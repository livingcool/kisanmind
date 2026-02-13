# KisanMind Render Deployment - Step-by-Step Guide

**Date**: 2026-02-13
**Status**: Production Deployment with Firebase Integration

---

## 🎯 Overview

This guide walks you through deploying KisanMind to Render with Firebase Firestore for persistent data storage. The system consists of:

1. **ML Inference Service** (Python FastAPI) - Port 8100
2. **API Server** (Node.js + Express) - Port 3001
3. **Frontend** (Next.js) - Deployed on Vercel

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ GitHub repository with latest code pushed
- ✅ Render account (https://render.com - free tier available)
- ✅ Vercel account (https://vercel.com - free tier available)
- ✅ Anthropic API key for Claude Opus 4.6
- ✅ Firebase project with Firestore database configured
- ✅ Firebase service account credentials (JSON file)

---

## 🔥 Step 0: Prepare Firebase Credentials

### Option 1: Individual Environment Variables

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key" → Download JSON file
3. Extract these values from the JSON:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Option 2: Base64-Encoded Service Account (Recommended for Render)

```bash
# Encode the entire service account JSON file
cat firebase-service-account.json | base64
```

Save the output as `FIREBASE_SERVICE_ACCOUNT_BASE64` environment variable.

**Note**: The private key should preserve newlines (`\n`). If using Option 1, wrap the entire key in double quotes.

---

## 🚀 Step 1: Deploy ML Inference Service to Render

### 1.1 Create Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `kisanmind`

### 1.2 Configure ML Service

Fill in the following settings:

| Field | Value |
|-------|-------|
| **Name** | `kisanmind-ml-service` |
| **Region** | Oregon (US West) |
| **Runtime** | Python 3 |
| **Root Directory** | `services/ml-inference` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

### 1.3 Environment Variables

Add the following in the "Environment" section:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11` |

### 1.4 Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for build to complete
3. Once deployed, note the service URL: `https://kisanmind-ml-service.onrender.com`

### 1.5 Verify ML Service

Test the health endpoint:

```bash
curl https://kisanmind-ml-service.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ml-inference",
  "version": "1.0.0",
  "capabilities": ["soil-classification", "crop-disease-detection"]
}
```

---

## 🚀 Step 2: Deploy API Server to Render

### 2.1 Create Web Service

1. Go to Render Dashboard → **"New +"** → **"Web Service"**
2. Connect the same GitHub repository: `kisanmind`

### 2.2 Configure API Server

| Field | Value |
|-------|-------|
| **Name** | `kisanmind-api` |
| **Region** | Oregon (US West) |
| **Runtime** | Node |
| **Build Command** | `npm install --include=dev && npm run build:mcp && (cd orchestrator && npx tsc) && cd api-server && npm install && npm run build` |
| **Start Command** | `cd api-server && npm start` |
| **Plan** | Free |

### 2.3 Environment Variables

Add the following environment variables in the Render dashboard:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3001` | Render may override with $PORT |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Your Claude API key |
| `ML_SERVICE_URL` | `https://kisanmind-ml-service.onrender.com` | From Step 1.4 |
| `FRONTEND_URL` | `https://kisanmind.vercel.app` | Will update after frontend deployment |
| **Firebase Option 1: Individual credentials** |
| `FIREBASE_PROJECT_ID` | `your-project-id` | From Firebase Console |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@....iam.gserviceaccount.com` | |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` | Wrap in quotes! |
| **Firebase Option 2: Base64 (alternative to Option 1)** |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | `eyJwcm9qZWN0X2lkIjo...` | Base64-encoded JSON |

**Important**:
- Use **either** Option 1 (individual vars) **or** Option 2 (base64), not both
- For `FIREBASE_PRIVATE_KEY`, ensure it includes `\n` characters and is wrapped in double quotes

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait 5-8 minutes for build to complete (builds MCP servers + orchestrator)
3. Note the API server URL: `https://kisanmind-api.onrender.com`

### 2.5 Verify API Server

Test the health endpoint:

```bash
curl https://kisanmind-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-13T...",
  "orchestrator": "ready",
  "storage": "firestore"
}
```

**Note**: If `storage: "in-memory"`, check Firebase environment variables and Render logs.

---

## 🚀 Step 3: Deploy Frontend to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com/new
2. Import your GitHub repository: `kisanmind`
3. Vercel will auto-detect Next.js

### 3.2 Configure Build Settings

| Field | Value |
|-------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |

### 3.3 Environment Variables

Add the following in Vercel's "Environment Variables" section:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://kisanmind-api.onrender.com` | Production |
| `NEXT_PUBLIC_ML_SERVICE_URL` | `https://kisanmind-ml-service.onrender.com` | Production |

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Note the frontend URL: `https://kisanmind.vercel.app`

### 3.5 Update API Server CORS

Go back to Render → kisanmind-api → Environment:

1. Update `FRONTEND_URL` to your Vercel URL: `https://kisanmind.vercel.app`
2. Click **"Save Changes"** (Render will auto-redeploy)

---

## ✅ Step 4: Verify End-to-End Deployment

### 4.1 Test ML Service

```bash
# Upload a test soil image
curl -X POST https://kisanmind-ml-service.onrender.com/analyze-soil \
  -F "image=@services/ml-inference/test_black_soil.jpg" \
  -F "latitude=20.0" \
  -F "longitude=77.0"
```

### 4.2 Test API Server

```bash
# Check health with Firebase status
curl https://kisanmind-api.onrender.com/health
```

### 4.3 Test Full Flow (via Frontend)

1. Visit `https://kisanmind.vercel.app`
2. Enter location: **Vidarbha, Maharashtra**
3. Land size: **3 acres**
4. Water source: **Borewell**
5. Click **"Take Photos"** (optional)
   - Grant camera permission
   - Capture 2 soil images
   - Capture 2 crop images
   - Upload images
6. Click **"Get Recommendations"**
7. Wait for AI analysis (~30-60 seconds)
8. Verify report includes:
   - ✅ Recommended crop with profit estimate
   - ✅ Sowing details
   - ✅ Water management strategy
   - ✅ Selling strategy
   - ✅ Government schemes
   - ✅ Risk warnings
   - ✅ Monthly action plan

### 4.4 Verify Firebase Persistence

1. Submit a farming plan request
2. Note the session ID (e.g., `session-1739123456-abc123`)
3. Go to Firebase Console → Firestore Database
4. Check `sessions` collection for your session document
5. Verify it contains:
   - `status`: "completed"
   - `report`: Farming decision report
   - `createdAt`: Timestamp
   - `expiresAt`: 30 days from creation

---

## 🔍 Troubleshooting

### Issue: API Server shows `storage: "in-memory"` instead of `storage: "firestore"`

**Possible causes:**
- Firebase credentials not set correctly
- Private key doesn't include `\n` newlines
- Base64 encoding is malformed

**Solution:**
1. Check Render logs: Dashboard → kisanmind-api → Logs
2. Look for Firebase initialization errors
3. Verify environment variables are set (check for typos)
4. For `FIREBASE_PRIVATE_KEY`, ensure it's wrapped in double quotes:
   ```
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
   ```

### Issue: ML Service times out on first request

**Cause**: Render free tier services sleep after 15 minutes of inactivity. First request after sleep takes 30-60 seconds.

**Solution**:
- Wait for cold start to complete
- Consider using Render's paid plan ($7/month) for always-on services
- Implement a health check ping service (e.g., UptimeRobot)

### Issue: Frontend can't reach API server

**Cause**: CORS misconfiguration

**Solution**:
1. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Check Render logs for CORS errors
3. Ensure Vercel URL is correct in `NEXT_PUBLIC_API_URL`

### Issue: "Orchestrator not initialized" error

**Cause**: Build failed to compile orchestrator TypeScript

**Solution**:
1. Check Render build logs
2. Verify build command includes: `(cd orchestrator && npx tsc)`
3. Check for TypeScript compilation errors

### Issue: Images not uploading (visual assessment)

**Cause**: File size too large or ML service unavailable

**Solution**:
1. Check image size (max 20MB per image)
2. Verify ML service is running: `curl https://kisanmind-ml-service.onrender.com/health`
3. Check browser console for errors
4. Ensure `NEXT_PUBLIC_ML_SERVICE_URL` is set correctly in Vercel

---

## 📊 Monitoring & Logs

### Render Logs

**ML Service**: Dashboard → kisanmind-ml-service → Logs
**API Server**: Dashboard → kisanmind-api → Logs

### Vercel Logs

Dashboard → kisanmind → Deployments → [Latest] → View Function Logs

### Firebase Logs

Firebase Console → Firestore Database → Usage tab

---

## 💰 Cost Breakdown

### Free Tier (Hackathon)

| Service | Plan | Cost |
|---------|------|------|
| Render ML Service | Free | $0 |
| Render API Server | Free | $0 |
| Vercel Frontend | Hobby | $0 |
| Firebase Firestore | Spark | $0 (up to 1GB, 50K reads/day) |
| **Total** | | **$0/month** |

**Limits:**
- Render free tier: 750 hours/month (services sleep after 15 min inactivity)
- Vercel: 100GB bandwidth/month
- Firebase: 1GB storage, 50K document reads/day, 20K writes/day

### Production Tier (Post-Hackathon)

| Service | Plan | Cost |
|---------|------|------|
| Render ML Service | Starter | $7/month |
| Render API Server | Starter | $7/month |
| Vercel Frontend | Pro | $20/month |
| Firebase Firestore | Blaze (Pay-as-you-go) | ~$5-10/month |
| **Total** | | **~$39-44/month** |

---

## 🔐 Security Checklist

Before going live:

- [x] All API keys stored as environment variables (not in code)
- [x] CORS configured with explicit allowed origins
- [x] Firebase security rules configured (Firestore rules)
- [x] HTTPS enabled (automatic on Render/Vercel)
- [ ] Rate limiting added to API endpoints (TODO)
- [ ] Input validation and sanitization (partially done)
- [ ] Image metadata sanitization (EXIF removal - TODO)
- [ ] API key rotation strategy documented
- [ ] Error messages don't leak sensitive info (done)
- [ ] Session cleanup runs every 10 minutes (done)

---

## 🎉 Deployment Complete!

Your KisanMind system is now live with:

✅ ML inference service for visual intelligence
✅ API server with Claude Opus 4.6 orchestration
✅ Firebase Firestore for persistent data storage
✅ Frontend with camera-based land assessment
✅ Multi-language support (5 languages)
✅ Government scheme recommendations
✅ Market price intelligence

**Production URLs:**
- Frontend: `https://kisanmind.vercel.app`
- API Server: `https://kisanmind-api.onrender.com`
- ML Service: `https://kisanmind-ml-service.onrender.com`

---

## 📞 Support

For deployment issues:
- Check Render logs first
- Review Firebase Console for database errors
- Test each service independently before end-to-end testing
- Refer to [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for architectural details

---

**Last Updated**: 2026-02-13
**Version**: 1.0.0
**Status**: ✅ Production Ready with Firebase Integration
