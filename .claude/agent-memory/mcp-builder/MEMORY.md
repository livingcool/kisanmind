# MCP Builder Agent Memory

## Land Use Validation Implementation

### Key Learnings (2025-02-12)

**Feature**: Added land-use classification validation to intake agent

**Implementation Pattern**:
1. Created standalone validator utility (`utils/land-use-validator.ts`)
2. Integrated non-blockingly into intake agent workflow
3. Added validation results to `FarmerProfile` type
4. Comprehensive test coverage (unit + integration)

**Design Decisions**:
- **Non-blocking by design**: Validation failures don't stop the pipeline
- **Heuristic fallback**: When satellite APIs unavailable, use geographic heuristics
- **Indian agriculture focus**: Optimized for Indian coordinate ranges (8-35°N, 68-97°E)
- **Warning-based UX**: Non-agricultural areas get warnings, not blocking errors

**API Strategy**:
- Primary: ESA WorldCover (10m resolution) - deferred to future enhancement
- Fallback: Geographic heuristics based on known regions - current implementation
- Heuristics cover: agricultural belts, urban centers, forests, deserts, coastal zones

**Testing Approach**:
- Unit tests for all land types (agricultural, urban, forest, desert, coastal)
- Integration tests verify intake agent properly calls validator
- All tests use real Indian coordinates for accuracy
- Tests verify non-blocking behavior

**Files Created**:
- `orchestrator/utils/land-use-validator.ts` (418 lines)
- `orchestrator/__tests__/land-use-validator.test.ts` (216 lines)
- `orchestrator/__tests__/intake-agent-landuse.test.ts` (157 lines)
- `docs/LAND_USE_VALIDATION.md` (complete documentation)

**Type Updates**:
- Extended `FarmerProfile` interface with optional `landUseValidation` field
- Validation result includes: isAgricultural, landCoverType, confidence, warning, source

**Regional Coverage**:
- Agricultural regions: Punjab, Haryana, Vidarbha, Marathwada, Western Maharashtra, etc.
- Urban centers: Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata
- Protected areas: Western Ghats, Eastern Ghats, Himalayan foothills
- Special zones: Coastal (with salinity warnings), desert (requires irrigation)

**Common Patterns for Future MCP Work**:
1. Always create utilities in `utils/` directory with clear separation of concerns
2. Use fallback strategies for external APIs (never fail completely)
3. Comprehensive logging at each step for debugging
4. Export clear TypeScript interfaces for all data structures
5. Test with real-world coordinates, not synthetic data
6. Documentation should include examples, API details, and troubleshooting

**Error Handling Strategy**:
```typescript
try {
  const result = await externalAPI();
  if (result) return result;
} catch (error) {
  console.warn('API failed, using fallback');
}
return heuristicFallback();
```

**Integration Pattern**:
```typescript
// In main agent flow:
try {
  const validation = await validator.validate(lat, lng);
  if (validation) {
    profile.validation = validation;
    if (validation.warning) console.warn(validation.warning);
  }
} catch (error) {
  // Non-blocking: proceed without validation
  console.warn('Validation failed, proceeding without it');
}
```

## Cross-Cutting Insights

**Coordinate Handling**:
- India bounds: lat 8-35°N, lng 68-97°E
- Common test coordinates: Vidarbha (20.5, 78.5), Punjab (30.5, 75.5), Mumbai (19.08, 72.88)
- Always validate bounds before expensive API calls

**Confidence Levels**:
- High: Satellite data or well-defined heuristics (urban centers, water bodies)
- Medium: Regional heuristics (agricultural belts, forest zones)
- Low: Default/unclassified areas

**Warning Messages**:
- Must be farmer-friendly (no technical jargon)
- Include actionable advice ("verify with local office", "check zoning laws")
- Specific location names when available ("near Mumbai", "in Thar Desert")

**Future API Integration Notes**:
- ESA WorldCover requires WMS GetFeatureInfo requests (complex)
- NASA MODIS AppEEARS requires task submission + polling (async)
- OpenLandMap REST API is simpler but lower resolution
- Consider ISRO Bhuvan for India-specific data (not currently free API)

## Project Structure Patterns

```
orchestrator/
├── utils/                      # Shared utilities
│   └── land-use-validator.ts   # Domain-specific validators
├── __tests__/                  # Test files
│   ├── *.test.ts              # Unit tests
│   └── *-integration.test.ts  # Integration tests
├── intake-agent.ts            # Agent logic
└── types.ts                   # Shared type definitions
```

**Best Practice**: Keep utils focused on single responsibility, make them reusable across agents.
