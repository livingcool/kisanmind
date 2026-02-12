# KisanMind 🌾

**AI-Powered Agricultural Intelligence & Profit Advisory System**

KisanMind answers the farmer's most critical question: **"What should I plant this season to make the most money?"**

Built for the [Anthropic Claude Code Hackathon](https://www.anthropic.com) (Feb 10-16, 2025) - Problem Statement 2: "Break the Barriers"

## 🎯 What KisanMind Does

KisanMind synthesizes data across **5 critical dimensions** to provide farmers with comprehensive, location-specific, profit-optimized farming recommendations:

1. **Soil Analysis** - Soil type, pH, drainage, crop suitability
2. **Water Assessment** - Water quality, salinity, groundwater depletion
3. **Climate Forecasting** - Rainfall, temperature, drought probability
4. **Market Intelligence** - Crop prices, trends, nearby mandis
5. **Government Schemes** - Subsidies, insurance, direct benefits

### Key Outputs
- ✅ Best crop for **maximum profit** (with exact numbers)
- ✅ Specific variety and sowing date
- ✅ Water management strategy
- ✅ Selling location and timing
- ✅ Government schemes to apply for
- ✅ Top 3 risks and mitigation strategies
- ✅ Month-by-month action plan

## 🏗️ Architecture

### Multi-Agent System with Claude Opus 4.6

```
Farmer Input (voice/text)
    ↓
Intake Agent (Haiku 4.5)
    ↓
Orchestrator (Opus 4.6)
    ↓
┌─────────┬─────────┬──────────┬─────────┬──────────┐
│Ground   │Water    │Climate   │Market   │Scheme    │
│Analyzer │Assessor │Forecaster│Intel    │Finder    │
│(Haiku)  │(Haiku)  │(Haiku)   │(Haiku)  │(Haiku)   │
└─────────┴─────────┴──────────┴─────────┴──────────┘
    ↓
Synthesis Agent (Opus 4.6 + Extended Thinking)
    ↓
Complete Farming Decision Report
```

### 5 MCP Servers

Each MCP server wraps multiple free APIs:

1. **mcp-soil-intel** - SoilGrids, FAO, ISRIC, OpenLandMap
2. **mcp-water-intel** - WHO GEMS/Water, USGS, CGWB, NASA GRACE
3. **mcp-climate-intel** - NOAA, NASA POWER, CHIRPS, Open-Meteo, IMD
4. **mcp-market-intel** - Agmarknet, data.gov.in, FAO, eNAM, WFP VAM
5. **mcp-scheme-intel** - PM-KISAN, PMFBY, State portals, DBT, NABARD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/kisanmind.git
cd kisanmind

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Install dependencies for all MCP servers
cd mcp-servers/mcp-soil-intel && npm install && cd ../..
cd mcp-servers/mcp-water-intel && npm install && cd ../..
cd mcp-servers/mcp-climate-intel && npm install && cd ../..
cd mcp-servers/mcp-market-intel && npm install && cd ../..
cd mcp-servers/mcp-scheme-intel && npm install && cd ../..

# Install orchestrator dependencies
cd orchestrator && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Build all MCP servers
npm run build:mcp

# Build orchestrator
npm run build:orchestrator
```

### Running the System

```bash
# Start the frontend development server
npm run dev

# In another terminal, start the orchestrator
npm run start:orchestrator
```

Navigate to `http://localhost:3000` to use KisanMind.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

### Demo Test Case

**Vidarbha, Maharashtra farmer:**
- 3 acres land
- Borewell water source
- Previous crop: Cotton (failed)
- Budget: ₹50,000

## 🌍 Multi-Language Support

KisanMind supports:
- 🇮🇳 Hindi
- 🇮🇳 Marathi
- 🇮🇳 Tamil
- 🇮🇳 Telugu

All outputs are in plain language, farmer-facing format with no technical jargon.

## 🛠️ Technology Stack

- **AI Models**: Claude Opus 4.6, Claude Haiku 4.5
- **MCP SDK**: @modelcontextprotocol/sdk
- **Backend**: TypeScript, Node.js
- **Frontend**: Next.js, Tailwind CSS, Leaflet.js
- **Translation**: i18next
- **Testing**: Jest, ts-jest

## 📊 Project Structure

```
kisanmind/
├── mcp-servers/          # 5 MCP servers for data
├── orchestrator/         # Multi-agent orchestration
├── frontend/            # Next.js web application
├── docs/                # Documentation
├── CLAUDE.md            # Project instructions for Claude Code
├── package.json         # Root dependencies
└── README.md            # This file
```

## 🎓 Key Features

### Extended Thinking with Opus 4.6
The synthesis agent uses Claude Opus 4.6's extended thinking capability to perform deep multi-factor reasoning across conflicting data streams, balancing soil suitability, water constraints, climate risks, market demand, and subsidies.

### Parallel Agent Execution
All 5 assessment agents run in parallel using Promise.all to minimize latency and provide fast recommendations.

### Smart Caching
- Soil data: Cached aggressively (changes slowly)
- Climate data: Cached with TTL
- Market prices: Daily refresh
- Schemes: Weekly refresh with manual update capability

## 🤝 Contributing

This project was built for the Anthropic Claude Code Hackathon. Contributions welcome after the hackathon period!

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- Powered by [Claude Opus 4.6](https://www.anthropic.com/claude)
- MCP Protocol by [Anthropic](https://www.anthropic.com)

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for Indian farmers**
