# Orchestrator Builder Memory

## Project Structure
- Orchestrator files: `E:\2026\Claude-Hackathon\kisanmind\orchestrator\`
- Key files: `types.ts`, `intake-agent.ts`, `orchestrator.ts`, `synthesis-agent.ts`, `mcp-client.ts`, `index.ts`
- Tests: `orchestrator/__tests__/` (4 test files, 45 tests)
- MCP servers: `mcp-servers/mcp-{soil,water,climate,market,scheme}-intel/`

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

## Test Patterns
- Mock `@anthropic-ai/sdk` with `jest.mock()` before imports
- Mock MCP client module entirely for orchestrator tests
- Mock `IntakeAgent` and `SynthesisAgent` as classes with `jest.fn().mockImplementation()`
- Progress callback tests collect stage names in array
