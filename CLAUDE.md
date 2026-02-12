# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**KisanMind** is an AI-powered agricultural intelligence and profit advisory system that provides farmers with comprehensive, location-specific farming recommendations. The system answers the critical question: "What should I plant this season to make the most money?" by synthesizing data across soil, water, climate, market prices, and government schemes.

**Core Philosophy**: Every output must answer "What should I DO, and will it make me money?" — not data dashboards, but actionable farming decisions.

## System Architecture

KisanMind uses a multi-agent architecture orchestrated by Claude Opus 4.6 with extended thinking enabled:

### Agent Pipeline
```
Farmer Input (voice/text)
    ↓
Intake Agent (Haiku 4.5) - Extracts location, land size, water source, crops, budget
    ↓
Orchestrator (Opus 4.6) - Builds farmer profile, dispatches 5 parallel agents
    ↓
┌─────────┬─────────┬──────────┬─────────┬──────────┐
│Agent 1  │Agent 2  │Agent 3   │Agent 4  │Agent 5   │
│Ground   │Water    │Climate   │Market   │Scheme    │
│Analyzer │Assessor │Forecaster│Intel    │Finder    │
│[MCP:    │[MCP:    │[MCP:     │[MCP:    │[MCP:     │
│soil]    │water]   │climate]  │market]  │govt]     │
└─────────┴─────────┴──────────┴─────────┴──────────┘
    ↓
Synthesis Agent (Opus 4.6) - Extended thinking enabled
    ↓
Complete Farming Decision Report (plain language, translated)
```

### The 5 MCP Servers

Each MCP server wraps multiple free APIs and provides structured agricultural intelligence:

1. **mcp-soil-intel**: Soil type, pH, drainage, crop suitability
   - APIs: SoilGrids, FAO World Soil Database, ISRIC, OpenLandMap

2. **mcp-water-intel**: Water quality, salinity, groundwater depletion
   - APIs: WHO GEMS/Water, USGS Water Portal, Central Ground Water Board, NASA GRACE

3. **mcp-climate-intel**: Rainfall forecasts, temperature, drought probability
   - APIs: NOAA Climate Data, NASA POWER, CHIRPS, Open-Meteo, IMD

4. **mcp-market-intel**: Crop prices, market trends, nearby mandis
   - APIs: Agmarknet, data.gov.in, FAO food prices, eNAM, WFP VAM

5. **mcp-scheme-intel**: Government schemes, insurance, subsidies
   - APIs: PM-KISAN portal, PMFBY, State agriculture portals, DBT, NABARD

## Technology Stack

**AI/ML**:
- Claude Opus 4.6 (orchestrator + synthesis, extended thinking enabled)
- Claude Haiku 4.5 (5 parallel assessment agents)
- Anthropic MCP SDK (TypeScript)

**Backend**:
- TypeScript for all MCP servers
- Node.js runtime
- REST API integrations for data sources

**Frontend**:
- Next.js + Tailwind CSS
- Leaflet.js for interactive maps (mandi locator)
- i18next for multi-language support (Hindi, Marathi, Tamil, Telugu)

## Project Structure

```
kisanmind/
├── mcp-servers/
│   ├── mcp-soil-intel/       # Soil analysis MCP server
│   ├── mcp-water-intel/      # Water quality MCP server
│   ├── mcp-climate-intel/    # Climate & weather MCP server
│   ├── mcp-market-intel/     # Market prices MCP server
│   └── mcp-scheme-intel/     # Government schemes MCP server
├── orchestrator/             # Opus 4.6 orchestration logic
│   ├── intake-agent.ts       # Farmer input parser
│   ├── orchestrator.ts       # Multi-agent dispatcher
│   └── synthesis-agent.ts    # Final report generation
├── frontend/                 # Next.js application
│   ├── components/
│   ├── pages/
│   └── public/
└── docs/
    └── KisanMind_Documentation.html
```

## Development Commands

Once the project is scaffolded:

```bash
# Install dependencies
npm install

# Build all MCP servers
npm run build:mcp

# Start development server
npm run dev

# Run orchestrator tests
npm test

# Type checking
npm run type-check

# Build for production
npm run build
```

## Key Architectural Decisions

### Opus 4.6 Extended Thinking
The synthesis agent runs with extended thinking enabled to perform multi-factor reasoning across 5 conflicting data streams. This is critical for generating profit-optimized recommendations that balance soil suitability, water constraints, climate risks, market demand, and available subsidies.

### Parallel Agent Execution
The 5 assessment agents (Haiku 4.5) run in parallel to minimize latency. The orchestrator collects all outputs before passing to the synthesis agent.

### MCP Server Design
Each MCP server encapsulates domain-specific logic and API integrations. They expose standardized tools that the agents can call. This modular design allows independent development and testing of each data layer.

### Synthesis Prompt Structure
The synthesis agent receives structured outputs from all 5 agents and runs a detailed prompt that asks:
1. Best crop for maximum profit (with exact numbers)
2. Specific variety and sowing date
3. Water management strategy
4. Exact selling location and timing
5. Government support to apply for
6. Top 3 risks and mitigation strategies
7. Month-by-month action plan

### Output Format
Final reports are farmer-facing: plain language, no jargon, actionable steps, profit estimates, and risk warnings. Always include government schemes the farmer qualifies for.

## API Rate Limits & Caching

All external APIs are free but may have rate limits:
- SoilGrids: No documented limit, cache aggressively
- NASA POWER: No key required, rate limit ~300 req/hour
- Open-Meteo: 10,000 req/day
- Agmarknet: Government API, potentially slow, cache results

Implement caching strategy for soil and climate data (changes slowly), refresh market data daily.

## Hackathon Constraints

This project is being built for the Anthropic Claude Code Hackathon (Feb 10-16, 2025):
- Must use Claude Opus 4.6 prominently
- Must be open source
- Must be built during the hackathon period
- Target: Problem Statement 2 ("Break the Barriers")

## Testing Strategy

For each MCP server:
1. Unit tests for API response parsing
2. Integration tests with live API calls (use real coordinates)
3. Mock data fallbacks for rate-limited APIs

For orchestrator:
1. Test with sample farmer inputs from different regions
2. Verify all 5 agents are called correctly
3. Validate synthesis agent output format

Demo test case: Vidarbha, Maharashtra farmer with 3 acres, borewell water, last crop cotton (failed).

## Multi-Language Support

Output must be translatable to local languages using i18next. Store translations for:
- Crop names
- Agricultural terms
- Action plan templates
- Government scheme descriptions

Priority languages: Hindi, Marathi (for Vidarbha region demo).

## Known Data Gaps

- Real-time mandi prices: Agmarknet can be outdated, supplement with eNAM
- Groundwater salinity: WHO data is coarse, may need regional databases
- Government scheme eligibility: Rules change frequently, add "verify with local office" disclaimers
