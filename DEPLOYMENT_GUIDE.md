# KisanMind Deployment Guide

## Free Hosting Strategy

Deploy KisanMind using free tiers of Vercel (frontend) and Render (API server).

---

## Part 1: Deploy API Server to Render

### Step 1: Prepare API Server for Deployment

1. Create `api-server/package.json` if it doesn't have one:

```json
{
  "name": "kisanmind-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@anthropic-ai/sdk": "^0.32.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

2. Create `api-server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["*.ts", "../orchestrator/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

3. Update `api-server/index.ts` to use environment variable for PORT:

```typescript
const PORT = process.env.PORT || 3001;
```

### Step 2: Deploy to Render

1. **Sign up**: Go to https://render.com and sign up (free)

2. **New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `kisanmind` repository

3. **Configure Service**:
   ```
   Name: kisanmind-api
   Environment: Node
   Region: Choose nearest (Oregon/Frankfurt/Singapore)
   Branch: master
   Root Directory: api-server
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Environment Variables**:
   - Click "Environment" tab
   - Add:
     ```
     ANTHROPIC_API_KEY=your_actual_api_key_here
     NODE_ENV=production
     ```

5. **Free Tier Settings**:
   - Instance Type: Free
   - Auto-Deploy: Yes

6. **Deploy**: Click "Create Web Service"

7. **Copy API URL**: After deployment, copy the URL (e.g., `https://kisanmind-api.onrender.com`)

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. Update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://kisanmind-api.onrender.com
```

2. Update `frontend/lib/api.ts` to use environment variable:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

3. Add `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Step 2: Deploy to Vercel

**Option A: Deploy via Vercel CLI (Fastest)**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: kisanmind
# - Directory: ./
# - Override settings? No

# Production deployment
vercel --prod
```

**Option B: Deploy via Vercel Dashboard**

1. **Sign up**: Go to https://vercel.com and sign up with GitHub

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import your `kisanmind` repository
   - Select `frontend` as root directory

3. **Configure**:
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Environment Variables**:
   - Add: `NEXT_PUBLIC_API_URL` = `https://kisanmind-api.onrender.com`

5. **Deploy**: Click "Deploy"

6. **Custom Domain** (Optional):
   - Go to Settings → Domains
   - Add: `kisanmind.vercel.app` (or custom domain)

---

## Part 3: Post-Deployment

### Test Your Deployment

1. **Frontend**: Visit `https://kisanmind.vercel.app`
2. **API Health**: Visit `https://kisanmind-api.onrender.com/health`
3. **Submit Test**: Fill farmer form and verify farming plan generation

### Enable CORS

Update `api-server/index.ts`:

```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://kisanmind.vercel.app', 'https://your-custom-domain.com']
    : 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
```

### Monitor Free Tier Limits

**Render Free Tier**:
- 750 hours/month (enough for hackathon demo)
- Spins down after 15 min inactivity (first request takes 30s to wake)
- 512 MB RAM, 0.1 CPU

**Vercel Free Tier**:
- Unlimited bandwidth
- 100 GB-hours per month
- Automatic global CDN

---

## Alternative Free Hosting Options

### Option 2: Railway (All-in-One)

**Pros**: Deploy both frontend + API in one place
**Cons**: Free tier limited to 500 hours/month

1. Sign up: https://railway.app
2. New Project → Deploy from GitHub
3. Add two services: Frontend (Next.js) + API (Node)
4. Set environment variables
5. Deploy

### Option 3: Fly.io (API) + Vercel (Frontend)

**Pros**: Generous free tier, better performance
**Cons**: Requires Docker knowledge

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. `fly launch` in api-server directory
3. Deploy: `fly deploy`

---

## Troubleshooting

### API Server Not Responding
- Check Render logs: Dashboard → Logs
- Verify ANTHROPIC_API_KEY is set
- Ensure PORT is set correctly

### Frontend Not Connecting to API
- Check browser console for CORS errors
- Verify NEXT_PUBLIC_API_URL is correct
- Test API health endpoint directly

### MCP Servers Not Starting
- Increase Render instance startup timeout
- Check orchestrator logs for MCP connection errors
- Verify all dependencies installed

### Cold Start Issues (Render Free Tier)
- First request after 15 min takes 30s (server waking)
- Add loading state: "Server waking up, please wait..."
- Consider upgrading to paid tier for production

---

## Cost Breakdown

| Service | Free Tier | Paid Upgrade |
|---------|-----------|--------------|
| **Vercel** | Unlimited | $20/mo (Pro) |
| **Render** | 750 hrs/mo | $7/mo (Starter) |
| **Railway** | 500 hrs/mo | $5/mo usage-based |
| **Fly.io** | 3 VMs free | $1.94/mo per VM |
| **Total** | **$0/month** | ~$12-27/mo |

---

## Production Checklist

- [ ] API deployed to Render/Railway/Fly.io
- [ ] Frontend deployed to Vercel
- [ ] ANTHROPIC_API_KEY set in API environment
- [ ] NEXT_PUBLIC_API_URL set in frontend environment
- [ ] CORS configured for production domain
- [ ] Health endpoint returns 200
- [ ] Test farmer input → farming plan flow
- [ ] All 5 MCP servers starting successfully
- [ ] Error monitoring enabled (optional: Sentry)
- [ ] Custom domain added (optional)

---

## Demo Video Recording

Once deployed:

1. Open `https://kisanmind.vercel.app`
2. Record screen walkthrough:
   - Homepage hero section
   - Farmer input form with GPS
   - Real-time agent progress
   - Complete farming plan display
   - Mandi map visualization
   - Government scheme cards
3. Highlight "Powered by Claude Opus 4.6"
4. Show extended thinking in action (synthesis agent)

---

## Support

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Deployment issues: Check logs first, then GitHub issues

**Hackathon Demo Ready!** 🎉
