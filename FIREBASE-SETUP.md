# Firebase Setup Guide for KisanMind

**Complete Firebase Firestore integration for persistent data storage**

---

## 🎯 What's Stored in Firebase?

KisanMind stores **ALL data** in Firebase Firestore for complete persistence across server restarts.

### 📊 Data Collections

| Collection | Data Type | TTL | Purpose |
|------------|-----------|-----|---------|
| **sessions** | Farmer sessions | 30 days | Stores farmer input, agent statuses, and final farming reports |
| **visualAssessments** | ML analysis results | 30 days | Stores soil classification and crop disease detection from images |

---

## 📦 Collection 1: sessions

**Document Structure:**
```typescript
{
  sessionId: string;                     // e.g., "session-1739123456-abc123"
  status: "processing" | "completed" | "error";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;                  // 30 days from creation

  farmerInput: {
    location: { address: string; coordinates: {...} };
    landSize: string;
    waterSource: string;
    previousCrops: string[];
    budget: number;
    notes?: string;
  };

  agentStatuses: [
    {
      name: "Ground Analyzer" | "Water Assessor" | "Climate Forecaster" | "Market Intel" | "Scheme Finder" | "Visual Analyzer";
      status: "pending" | "running" | "completed" | "error";
      progress: number;                  // 0-100
      message: string;
    },
    // ... 5 or 6 agents total
  ];

  synthesis?: {
    recommendedCrop: {...};
    sowingDetails: {...};
    waterManagement: {...};
    sellingStrategy: {...};
    governmentSchemes: [...];
    riskWarnings: [...];
    actionPlan: [...];
  };

  error?: string;
}
```

**Queries:**
- Get session by ID: `sessions.doc(sessionId).get()`
- Find expired sessions: `sessions.where('expiresAt', '<', now).limit(500)`

---

## 📦 Collection 2: visualAssessments

**Document Structure:**
```typescript
{
  id: string;                            // e.g., "va-1739123456-xyz789"
  sessionId: string;                     // Links to sessions collection
  createdAt: Timestamp;
  expiresAt: Timestamp;                  // 30 days from creation

  // Soil analysis (from ML service)
  soilAnalysis: {
    soil_type: string;                   // "Black Cotton Soil", "Red Soil", etc.
    confidence: number;                  // 0.0 - 1.0
    texture: string;                     // "clayey", "sandy", "loamy"
    estimated_ph: number;                // 4.5 - 9.0
    organic_carbon_pct: number;
    drainage: string;                    // "good", "moderate", "poor"
    nutrients: {
      nitrogen_kg_ha: number;
      phosphorus_kg_ha: number;
      potassium_kg_ha: number;
    };
    suitable_crops: string[];
    common_regions: string[];
    recommendations: string[];
  } | null;

  soilImageCount: number;                // How many soil images analyzed

  // Crop analysis (from ML service)
  cropAnalysis: {
    health_score: number;                // 0.0 - 1.0
    assessment: string;
    growth_stage: string;
    detected_diseases: [
      {
        disease: string;
        confidence: number;
        severity: "Low" | "Medium" | "High";
        affected_area_pct: number;
        treatment: string;
        prevention: string;
      }
    ];
    disease_count: number;
    recommendations: string[];
  } | null;

  cropImageCount: number;                // How many crop images analyzed

  // Metadata
  overallConfidence: number;             // Average of soil + crop confidence
  analysisType: "soil" | "crop" | "both";
  processingTime_ms: number;
  latitude: number | null;
  longitude: number | null;
}
```

**Queries:**
- Get assessment by ID: `visualAssessments.doc(id).get()`
- Get all assessments for session: `visualAssessments.where('sessionId', '==', sessionId).orderBy('createdAt', 'desc')`
- Get latest assessment: `visualAssessments.where('sessionId', '==', sessionId).orderBy('createdAt', 'desc').limit(1)`
- Find expired: `visualAssessments.where('expiresAt', '<', now).limit(500)`

---

## 🔧 Setup Instructions

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"** or select existing project
3. Enter project name: `kisanmind` (or your choice)
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

### Step 2: Enable Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add rules manually)
4. Choose location: **asia-south1 (Mumbai)** or closest to your users
5. Click **"Enable"**

### Step 3: Deploy Firestore Rules

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (from project root):
   ```bash
   firebase init firestore
   ```
   - Select: **"Use an existing project"**
   - Choose your **kisanmind** project
   - Accept default `firestore.rules` and `firestore.indexes.json`

4. Deploy the rules and indexes:
   ```bash
   firebase deploy --only firestore
   ```

This deploys:
- **firestore.rules**: Security rules allowing API server access
- **firestore.indexes.json**: Composite indexes for efficient queries

### Step 4: Create Service Account

1. Go to **Project Settings** (gear icon) → **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file (e.g., `kisanmind-firebase-adminsdk.json`)
4. **Keep this file secret!** Never commit to git

### Step 5: Configure Environment Variables

Choose **one** of these options:

#### Option A: Base64-Encoded (Recommended for Render)

```bash
# Encode the service account JSON
cat kisanmind-firebase-adminsdk.json | base64

# Add to Render environment variables:
FIREBASE_SERVICE_ACCOUNT_BASE64=<paste the base64 output here>
```

#### Option B: Individual Variables

Extract from `kisanmind-firebase-adminsdk.json`:

```env
FIREBASE_PROJECT_ID=kisanmind-abc123
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@kisanmind-abc123.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

**Important**: Wrap `FIREBASE_PRIVATE_KEY` in double quotes and preserve `\n` newlines!

---

## ✅ Verify Firebase Connection

After deploying your API server with Firebase credentials:

### 1. Check Health Endpoint

```bash
curl https://kisanmind-api.onrender.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-13T...",
  "orchestrator": "ready",
  "storage": "firestore"  ← Should say "firestore", not "in-memory"
}
```

### 2. Submit a Test Request

```bash
curl -X POST https://kisanmind-api.onrender.com/api/farming-plan \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"address": "Vidarbha, Maharashtra"},
    "landSize": "3",
    "waterSource": "borewell",
    "previousCrops": ["cotton"],
    "budget": "50000"
  }'
```

**Response:**
```json
{
  "sessionId": "session-1739123456-abc123"
}
```

### 3. Verify in Firebase Console

1. Go to **Firestore Database** in Firebase Console
2. You should see:
   - **sessions** collection with your session document
   - Session should have `status: "processing"` or `"completed"`

---

## 🔍 Firestore Console Navigation

### View Sessions

1. **Firestore Database** → **Data** tab
2. Click **sessions** collection
3. Click any document ID to view details
4. See `farmerInput`, `agentStatuses`, `synthesis`

### View Visual Assessments

1. **Firestore Database** → **Data** tab
2. Click **visualAssessments** collection
3. Click any document ID to view details
4. See `soilAnalysis`, `cropAnalysis`, metadata

### Monitor Usage

1. **Firestore Database** → **Usage** tab
2. Track:
   - **Document reads** (50K/day free tier)
   - **Document writes** (20K/day free tier)
   - **Storage** (1GB free tier)

---

## 🚨 Troubleshooting

### Issue: Health endpoint shows `"storage": "in-memory"`

**Possible causes:**
1. Environment variables not set correctly
2. Service account JSON is invalid
3. Private key doesn't include `\n` newlines

**Solution:**
- Check Render logs: Dashboard → kisanmind-api → Logs
- Look for errors like:
  ```
  [Firebase] Initialization failed: ...
  [Firebase] Entering fallback mode (in-memory storage)
  ```
- Verify environment variables are set
- For `FIREBASE_PRIVATE_KEY`, ensure it's wrapped in quotes and includes `\n`

### Issue: "PERMISSION_DENIED" errors

**Cause:** Firestore security rules too restrictive

**Solution:**
1. Go to **Firestore Database** → **Rules** tab
2. Verify rules allow API server access:
   ```
   allow read, write: if true;
   ```
3. Click **"Publish"** if you made changes

### Issue: "Missing required index" errors

**Cause:** Composite indexes not deployed

**Solution:**
```bash
firebase deploy --only firestore:indexes
```

Wait 2-3 minutes for indexes to build.

---

## 📊 Data Lifecycle

| Stage | TTL | Storage |
|-------|-----|---------|
| **Active session** | No limit | Firestore + In-Memory |
| **In-memory cache** | 1 hour | In-Memory only |
| **Firestore persistence** | 30 days | Firestore only |
| **Expired** | Deleted | None |

**Cleanup:**
- In-memory cache cleaned every 10 minutes (1 hour TTL)
- Firestore documents cleaned every 10 minutes (30 day TTL via `expiresAt` field)

---

## 💾 Data Retention Policy

- **Sessions**: 30 days from creation
- **Visual Assessments**: 30 days from creation
- **Automatic cleanup**: Every 10 minutes via background job
- **Manual cleanup**: Can delete collections via Firebase Console

---

## 🔐 Security Best Practices

1. **Never commit** `firebase-service-account.json` to git
2. **Add to .gitignore**:
   ```
   *firebase-adminsdk*.json
   firebase-debug.log
   .firebase/
   ```
3. **Rotate service accounts** periodically
4. **Use environment variables** for all credentials
5. **Monitor usage** in Firebase Console to detect anomalies
6. **Set budget alerts** in Firebase Console (Settings → Usage & Billing)

---

## 💰 Cost Estimate

### Free Tier (Spark Plan)
- ✅ 1GB storage
- ✅ 50,000 document reads/day
- ✅ 20,000 document writes/day
- ✅ 20,000 document deletes/day

**Expected usage for 100 farmers/day:**
- Writes: ~300/day (sessions + visual assessments + updates)
- Reads: ~1,000/day (polling, retrieval)
- **Cost**: $0/month (well within free tier)

### Paid Tier (Blaze Plan - Pay as you go)
**After 1,000 farmers/day:**
- Storage: $0.18/GB/month
- Reads: $0.06 per 100,000 documents
- Writes: $0.18 per 100,000 documents
- **Estimated cost**: $5-10/month

---

## 📚 References

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin Node.js SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Pricing](https://firebase.google.com/pricing)

---

**Last Updated**: 2026-02-13
**Status**: ✅ Complete Firebase Integration
