# Orchestrator Builder Memory

## Project Structure
- Orchestrator files: `E:\2026\Claude-Hackathon\kisanmind\orchestrator\`
- Key files: `types.ts`, `intake-agent.ts`, `orchestrator.ts`, `synthesis-agent.ts`, `mcp-client.ts`, `index.ts`
- Tests: `orchestrator/__tests__/` (6 test files, 31 core tests passing)
- MCP servers: `mcp-servers/mcp-{soil,water,climate,market,scheme}-intel/`
- ML inference: `services/ml-inference/` (Python FastAPI, port 8100)
- API server: `api-server/` (Express + TypeScript)
- Visual assessment: `api-server/visual-assessment-db.ts`, `api-server/visual-assessment-routes.ts`

## SDK Version
- **Anthropic SDK**: Updated from 0.32.1 to 0.74.0 (required for extended thinking support)
- Extended thinking types: `ThinkingBlock` with `type: 'thinking'`, `thinking: string`, `signature: string`
- Config: `thinking: { type: 'enabled', budget_tokens: N }` (min 1024)
- When extended thinking is enabled, temperature must be 1 (default)

## Architecture Decisions
- `Promise.allSettled()` used for MCP server calls (partial failure tolerance)
- Each MCP call wrapped with `withTimeout()` for independent timeouts
- `callServerSafe()` catches all exceptions to prevent `allSettled` rejections
- Retry with exponential backoff for transient API errors only
- Pipeline continues even if ALL 5 MCP servers fail (synthesis uses model knowledge)
- **Visual intelligence** is optional 6th data source, passed via `PipelineOptions`
- Visual data is pre-computed before pipeline, not part of `Promise.allSettled` MCP calls

## Visual Assessment Feature (added 2026-02-13)
- ML service: `services/ml-inference/app.py` (FastAPI, port 8100)
- Image heuristics: brightness, redness, greenness, texture variance, saturation
- Soil types: Black Cotton, Red, Alluvial, Laterite, Sandy Loam
- Crop diseases: Leaf Blight, Powdery Mildew, Rust, Bacterial Wilt, Aphid Infestation
- Deterministic results via MD5 seed from image bytes
- Deps: fastapi, uvicorn, Pillow, numpy (all pre-installed on dev machine)
- Multer (`@types/multer`) for file uploads in Express API server
- `VisualIntelligence` type in `orchestrator/types.ts`
- Synthesis prompt prioritizes visual > satellite for soil; crop diseases only from visual
- API routes: POST /api/visual-assessment, GET /api/visual-assessment/:id, GET /api/visual-assessment/session/:sessionId/latest

## TypeScript Config
- ESM modules (`"type": "module"` in package.json)
- Imports use `.js` extensions (TypeScript ESM convention)
- `orchestrator/tsconfig.json` extends root with `module: "ESNext"`
- Jest uses `ts-jest` with `useESM: true` and `moduleNameMapper` for `.js` -> `.ts`

## Common Issues
- Duplicate exports cause TS2323 (e.g., function + re-export at bottom)
- Old SDK (0.32.x) does not have `thinking` parameter - must upgrade
- Timer leaks in tests: use `jest.useFakeTimers()` for timeout tests
- JSON parsing from Claude: handle both bare JSON and markdown code blocks
- Pre-existing failures in `intake-agent-landuse.test.ts` (landUseValidation not populated by mock)
- Test mocks for `AggregatedIntelligence` must include `visualIntel: null` and `hasVisualData: false`

## Test Patterns
- Mock `@anthropic-ai/sdk` with `jest.mock()` before imports
- Mock MCP client module entirely for orchestrator tests
- Mock `IntakeAgent` and `SynthesisAgent` as classes with `jest.fn().mockImplementation()`
- Progress callback tests collect stage names in array

## Firebase Firestore Integration
- **Module**: `api-server/firebase.ts` -- all Firestore CRUD, retry logic, fallback mode
- **Storage strategy**: Dual-mode -- Firestore primary, in-memory Map fallback
- **Session TTL**: 30 days in Firestore, 1 hour in-memory
- **Progress sync**: Agent status updates throttled to every 2s
