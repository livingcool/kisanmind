# Orchestrator Builder Memory

## Project Structure
- Orchestrator files: `E:\2026\Claude-Hackathon\kisanmind\orchestrator\`
- Key files: `types.ts`, `intake-agent.ts`, `orchestrator.ts`, `synthesis-agent.ts`, `mcp-client.ts`, `index.ts`
- Video guidance: `video-guidance-orchestrator.ts`, `video-guidance-types.ts`, `capture-steps-config.ts`
- Tests: `orchestrator/__tests__/` (10 test files, 130+ tests passing)
- MCP servers: `mcp-servers/mcp-{soil,water,climate,market,scheme}-intel/`
- ML inference: `services/ml-inference/` (Python FastAPI, port 8100)
- TTS service: `services/tts-service/` (Express, port 8200)
- Video quality: `services/video-quality-service/` (Express + Sharp, port 8300)
- API server: `api-server/` (Express + TypeScript, port 3001)
- Frontend: `frontend/components/VideoGuidance/` (Next.js + React)
- Visual assessment: `api-server/visual-assessment-db.ts`, `api-server/visual-assessment-routes.ts`

## SDK Version
- **Anthropic SDK**: 0.74.0 (required for extended thinking support)
- Config: `thinking: { type: 'enabled', budget_tokens: N }` (min 1024)
- When extended thinking is enabled, temperature must be 1 (default)

## Architecture Decisions
- `Promise.allSettled()` for MCP server calls (partial failure tolerance)
- Each MCP call wrapped with `withTimeout()` for independent timeouts
- Pipeline continues even if ALL 5 MCP servers fail (synthesis uses model knowledge)
- **Visual intelligence** is optional 6th data source, passed via `PipelineOptions`
- Video guidance uses REST polling (WebSocket planned for Phase 2)
- TTS uses client-side Web Speech API as fallback when service unavailable

## Deployment (verified 2026-02-14)
- **ML Service** (port 8100): `py -m uvicorn app:app --host 0.0.0.0 --port 8100`
  - Soil: heuristic classifier based on image color features
  - Crop health: heuristic fallback when TF model not loaded (added 2026-02-14)
  - TF disease model optional at `models/disease/disease_model.keras`
- **API Server** (port 3001): `npx tsx watch index.ts` (dev mode)
  - Loads orchestrator from `../orchestrator/dist/index.js` (must be built first)
  - Firebase Firestore for persistent storage, in-memory fallback
- **Frontend** (port 3000): `npx next dev -p 3000`
- **Start order**: ML Service -> API Server -> Frontend
- Orchestrator build: `cd orchestrator && npx tsc`
- On Windows, use `taskkill //F //PID <pid>` (double-slash for bash escaping)

## Pipeline Performance (verified 2026-02-14, Vidarbha demo case)
- Intake Agent (Haiku 4.5): ~3s
- 5 MCP servers parallel: ~21s total (market fastest at ~2s, climate slowest at ~21s)
- Scheme MCP server: frequently errors (non-critical, graceful degradation)
- Synthesis (Opus 4.6, 10k thinking budget): ~230s (3-4 minutes)
- Total pipeline: ~254s (~4.2 minutes)
- Token usage: input ~12.5k, output ~10.7k for synthesis
- Full e2e via API: ~3m50s (Vidarbha soybean recommendation, 10-month action plan)
- Report quality: crop, variety, profit, sowing, water mgmt, 4 mandis, 6 schemes, 3 risks, 10 months

## Audio Guidance System (built 2026-02-13)
- 7-step capture: soil_1, soil_2, crop_healthy, crop_diseased, water_source, field_overview, weeds_issues
- Only soil_1 and soil_2 are required; rest are optional
- TTS translations: 5 languages (en, hi, mr, ta, te) with 21 instruction templates
- Quality analysis: Laplacian variance for blur, brightness 50-200, Sobel edge density
- Feedback throttling: 3s minimum interval, 3 consecutive good frames for confirmation
- Session timeout: 30 minutes of inactivity
- Frame analysis at 2 FPS for REST
- Frontend: `captureSteps.ts` (7 steps with UI metadata), `AudioGuidedCapture.tsx`, `AudioPlayer.tsx`
- See `audio-guidance-architecture.md` for details

## TypeScript Config
- ESM modules (`"type": "module"` in package.json)
- Imports use `.js` extensions (TypeScript ESM convention)
- Jest uses `ts-jest` with `useESM: true` and `moduleNameMapper` for `.js` -> `.ts`

## Common Issues
- Express `Response` vs global `Response` conflict: use `globalThis.Response` for fetch returns
- Duplicate exports cause TS2323
- Timer leaks in tests: cleanup setInterval causes forceExit warnings (benign)
- Pre-existing failures in mcp-soil-intel, mcp-water-intel, intake-agent-landuse (7 tests)
- API server tsconfig lacks @types/jest -- test files show TS errors but run via Jest
- OpenLandMap API returns 400 for some coordinates (handled by retry + fallback)
- Firestore composite index needed for visual assessment queries (non-blocking)
- Old processes can linger on ports -- check with `netstat -ano | findstr ":PORT"`
- TensorFlow protobuf import error on Python 3.12 -- ML service falls back to heuristics (OK for demo)
- Visual assessment POST is at `/api/visual-assessment` (not `/api/visual-assessment/analyze-soil`)
- Jest config is at root `jest.config.js` (NOT `orchestrator/jest.config.ts`)

## Test Patterns
- Mock `@anthropic-ai/sdk` with `jest.mock()` before imports
- Mock `global.fetch` for service call tests (TTS + quality service)
- Extract route handlers from Express Router stack for unit testing
- Use `--forceExit` flag due to cleanup timers
- 81 video guidance tests across 4 suites, all passing

## Firebase Firestore Integration
- **Module**: `api-server/firebase.ts` -- all Firestore CRUD, retry logic, fallback mode
- **Storage strategy**: Dual-mode -- Firestore primary, in-memory Map fallback
- **Session TTL**: 30 days in Firestore, 1 hour in-memory
- **Progress sync**: Agent status updates throttled to every 2s

## Bounding Box State Detection (2026-02-14)
- `approximateLocation` (crop-reference.ts) / `approximateState` (schemes-database.ts) use bounding boxes
- Order matters critically: smaller/more specific states checked FIRST
- Key overlaps resolved:
  - Haryana (lngMin 75.6) before Punjab (lngMax 76.9) -- longitude split
  - Karnataka before Tamil Nadu -- Kolar (13.1, 78.1) overlap
  - Kerala lngMax 76.6 to avoid Mysuru (76.64)
  - UP before MP -- Lucknow (26.8, 80.9) in overlap
  - Telangana before AP (carved out)
- Both files have independent copies -- MUST stay in sync

## India Data Coverage (2026-02-14)
- 110 mandis across 20 states (MAJOR_MANDIS in crop-reference.ts)
- 18 states with state-specific government schemes (STATE_SCHEMES + state-schemes.ts)
- 9 central schemes, 35 state schemes, 2 insurance, 5 subsidies, 3 credit
- All open-source data, documented in `mcp-servers/DATA-SOURCES.md`
- Tests: 41 market-intel + 31 scheme-intel = 72 tests all passing
- MCP server tests need `NODE_OPTIONS="--experimental-vm-modules" npx jest`
