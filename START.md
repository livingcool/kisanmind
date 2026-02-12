# 🚀 KisanMind - Quick Start Guide

## ✅ Prerequisites Check

All prerequisites are already set up:
- ✅ Node.js 24.11.1 installed
- ✅ All dependencies installed
- ✅ All components built successfully
- ✅ API key configured in .env

## 🎯 Running the Complete System

### Option 1: Automated Startup (Recommended)

**Start everything in separate terminals:**

**Terminal 1 - API Server:**
```bash
cd api-server
npm start
```
Wait until you see: "Ready to serve farming recommendations!"

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Wait until you see: "Local: http://localhost:3000"

### Option 2: Quick Test with CLI

**Test the orchestrator directly:**
```bash
cd orchestrator
node test-runner.js
```

This will:
- Process the Vidarbha farmer test case
- Call all 5 MCP servers
- Generate a complete farming report
- Save output to `output-report.json`

## 🌐 Accessing the Application

Once both servers are running:

1. **Open your browser:** http://localhost:3000
2. **Fill in the form** with farmer details:
   - Location: Vidarbha, Maharashtra
   - Land size: 3 acres
   - Water source: Borewell
   - Previous crops: Cotton
   - Budget: 50,000

3. **Click "Get Recommendations"**

4. **Wait ~30 seconds** for AI analysis

5. **View your complete farming plan!**

## 📊 What You'll Get

Your personalized farming report includes:
- ✅ Best crop recommendation with profit estimates
- ✅ Detailed sowing instructions
- ✅ Month-by-month action plan (12 months)
- ✅ Water management strategy
- ✅ Government schemes to apply for
- ✅ Risk assessment and mitigation
- ✅ Market timing and mandi locations

## 🔧 Troubleshooting

### API Server Not Starting
```bash
# Check if port 3001 is available
netstat -ano | findstr :3001

# Kill existing process if needed
taskkill /PID <PID> /F
```

### Frontend Not Starting
```bash
# Check if port 3000 is available
netstat -ano | findstr :3000

# Use different port if needed
cd frontend
PORT=3002 npm run dev
```

### API Connection Error
- Ensure API server is running on port 3001
- Check `.env` file has valid `ANTHROPIC_API_KEY`
- View API logs: `cat api-server.log`

### MCP Servers Not Responding
```bash
# Rebuild all MCP servers
npm run build:mcp

# Rebuild orchestrator
npm run build:orchestrator

# Rebuild API server
cd api-server && npm run build
```

## 🧪 Testing Components

### Test Individual MCP Servers
```bash
# Soil Intelligence
node mcp-servers/mcp-soil-intel/dist/index.js

# Water Intelligence
node mcp-servers/mcp-water-intel/dist/index.js

# Climate Intelligence
node mcp-servers/mcp-climate-intel/dist/index.js

# Market Intelligence
node mcp-servers/mcp-market-intel/dist/index.js

# Scheme Intelligence
node mcp-servers/mcp-scheme-intel/dist/index.js
```

### Run Test Suite
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## 📱 Mobile Testing

KisanMind is optimized for mobile. To test:

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update frontend: `NEXT_PUBLIC_API_URL=http://YOUR_IP:3001`
3. Access from phone: `http://YOUR_IP:3000`

## 🎥 Demo Scenario

**Vidarbha Cotton Farmer Scenario:**

```
Location: Vidarbha, Maharashtra
Land: 3 acres
Water: Borewell
Previous crop: Cotton (failed due to drought)
Budget: ₹50,000
Goal: Find profitable alternative crop
```

**Expected Recommendation:**
- Primary: Soybean (JS-335) - ₹21,440/acre profit
- Secondary: Chickpea (JG-11) - ₹25,900/acre profit
- **Total: ₹1,42,020 profit for 3 acres**

## 🛠️ Development Commands

```bash
# Build everything
npm run build

# Run tests
npm test

# Type checking
npm run type-check

# Start API server
npm run start:api

# Start frontend
npm run start:frontend
```

## 📝 Project Status

✅ **All Components Operational:**
- 5 MCP Servers (soil, water, climate, market, schemes)
- Orchestrator with Opus 4.6 extended thinking
- API Server (Express REST API)
- Frontend (Next.js with Tailwind CSS)
- 102/103 tests passing

## 🎯 Next Steps

1. ✅ Test complete user flow (input → report)
2. ✅ Verify multi-language support
3. ✅ Test mobile responsiveness
4. 📸 Capture demo screenshots
5. 🎬 Record demo video
6. 📄 Update final documentation

## 📞 Support

For issues or questions:
- Check logs: `api-server.log`
- View test output: `orchestrator/output-report.json`
- Review documentation: `README.md`

---

**Built with ❤️ using Claude Opus 4.6**
