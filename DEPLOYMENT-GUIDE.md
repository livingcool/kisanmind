# KisanMind Deployment Guide

**Complete guide for deploying KisanMind to production**

---

## 🏗️ Architecture Overview

KisanMind uses a **3-tier deployment architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (Vercel)                       │
│              https://kisanmind.vercel.app                │
│                    Next.js App                           │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              API SERVER (Render)                         │
│         https://kisanmind-api.onrender.com              │
│          Express + TypeScript + Orchestrator            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│            ML SERVICE (Render)                           │
│      https://kisanmind-ml-service.onrender.com          │
│              FastAPI + Python                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before deploying, ensure you have:

- [x] **GitHub Account** with repository access  
- [x] **Render Account** (https://render.com - free tier available)
- [x] **Vercel Account** (https://vercel.com - free tier available)
- [x] **Anthropic API Key** (for Claude Opus 4.6)
- [x] **Firebase Project** (optional, for data persistence)

---

## 🚀 Part 1: Deploy Backend Services to Render

### Step 1: Connect GitHub to Render

1. Go to https://render.com
2. Sign up or log in
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub account
5. Select repository: **livingcool/kisanmind**

### Step 2: Deploy from Blueprint

Render will automatically detect the `render.yaml` file and create:
- ✅ **ML Service** (kisanmind-ml-service)
- ✅ **API Server** (kisanmind-api)

**Deployment will start automatically!**

### Step 3: Configure Environment Variables

#### **For API Server (kisanmind-api)**

Go to service → Environment → Add Environment Variables:

**Required:**

| Variable | Value | How to Get |
|----------|-------|------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Get from https://console.anthropic.com/settings/keys |

**Optional (Firebase):**

| Variable | Value |
|----------|-------|
| `FIREBASE_PROJECT_ID` | `your-project-id` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@...` |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----...` |

### Step 4: Verify Backend Deployment

```bash
# Test ML Service
curl https://kisanmind-ml-service.onrender.com/health

# Test API Server
curl https://kisanmind-api.onrender.com/health
```

✅ **Backend is live if both return "healthy"**

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Import Repository

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import **livingcool/kisanmind**
4. Select **"frontend"** as root directory

### Step 2: Configure Environment Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://kisanmind-api.onrender.com` |

### Step 3: Deploy

Click **"Deploy"** - Done!

**Your site:** https://kisanmind.vercel.app

---

## ✅ Deployment Verification

- [ ] ML Service healthy
- [ ] API Server healthy  
- [ ] Frontend loads
- [ ] Can submit farming plan
- [ ] Results display correctly

---

## 🔧 Common Issues

**"ML Service Unavailable"**
- Check ML service status on Render
- Verify `ML_SERVICE_URL` environment variable

**"Anthropic API Error"**
- Verify `ANTHROPIC_API_KEY` is set
- Check API key is valid

**CORS Errors**
- Update `FRONTEND_URL` in API server to match Vercel URL

---

## 🚀 Your Live URLs

- **Frontend:** https://kisanmind.vercel.app
- **API:** https://kisanmind-api.onrender.com  
- **ML Service:** https://kisanmind-ml-service.onrender.com

---

**Last Updated:** February 14, 2026
