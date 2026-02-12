# Land Use Validation

## Overview

KisanMind includes automated land-use classification validation to verify if a farmer's location is suitable for agriculture. This helps detect cases where users may be in urban areas, forests, water bodies, or other non-agricultural zones.

## How It Works

### 1. Validation Process

When a farmer provides their location (explicitly or inferred), the Intake Agent automatically:

1. Extracts coordinates (latitude/longitude) from the input
2. Validates the land use classification using the `LandUseValidator`
3. Adds validation results to the farmer profile
4. Continues with analysis regardless of validation outcome (non-blocking)

### 2. Data Sources

The validator uses a **fallback strategy** to ensure reliability:

**Primary**: ESA WorldCover API
- 10m resolution satellite imagery
- Global coverage
- Updated annually
- *Note: Currently using heuristics fallback due to API complexity*

**Fallback**: Geographic heuristics
- Known agricultural belts in India
- Urban center detection
- Forest/protected area mapping
- Desert/arid region identification
- Coastal zone detection

### 3. Land Cover Classifications

#### Agricultural (Suitable)
- **Cropland**: Active agricultural areas
- **Grassland/Pasture**: Suitable for conversion or grazing
- **Coastal Agricultural**: Rice paddies, coconut plantations (with salinity warnings)

#### Non-Agricultural (Warnings Issued)
- **Urban/Built-up**: Cities, towns, developed areas
- **Forest**: Protected forest areas, tree cover
- **Shrubland**: Requires clearing, environmental permits
- **Desert/Barren**: Arid regions, sparse vegetation
- **Water**: Lakes, rivers, reservoirs
- **Wetland/Mangroves**: Protected ecosystems
- **Snow/Ice**: High-altitude regions

#### Special Cases
- **Unclassified**: Low-confidence areas (proceeds with caution)
- **Outside India**: Coordinates not within Indian boundaries

## Validation Results

The validation adds a `landUseValidation` field to the farmer profile:

```typescript
{
  isAgricultural: boolean;        // Is this agricultural land?
  landCoverType: string;          // Classification type
  confidence: 'high' | 'medium' | 'low';  // Confidence level
  warning?: string;               // User-facing warning message
  source: string;                 // Data source used
}
```

### Example Results

**Agricultural Land (Vidarbha)**:
```json
{
  "isAgricultural": true,
  "landCoverType": "cropland",
  "confidence": "medium",
  "source": "agricultural_belt_heuristics"
}
```

**Urban Area (Mumbai)**:
```json
{
  "isAgricultural": false,
  "landCoverType": "urban_built_up",
  "confidence": "high",
  "warning": "This location appears to be in or near Mumbai (urban area). Commercial agriculture may not be feasible in densely populated urban zones.",
  "source": "urban_heuristics"
}
```

**Desert Region (Rajasthan)**:
```json
{
  "isAgricultural": false,
  "landCoverType": "desert_barren",
  "confidence": "medium",
  "warning": "This location is in an arid/desert region. Agriculture requires extensive irrigation and may not be economically viable.",
  "source": "desert_heuristics"
}
```

## Non-Blocking Design

**Critical**: Land use validation is **non-blocking**. Even if:
- APIs fail
- Validation is uncertain
- Location is flagged as non-agricultural

The system will:
- ✅ Still create a farmer profile
- ✅ Still run all 5 MCP intelligence agents
- ✅ Still generate recommendations
- ⚠️ Include warnings in the final report

This design ensures the system helps farmers even in edge cases.

## Regional Coverage

### Well-Covered Agricultural Regions
- Punjab Plains (wheat/rice belt)
- Haryana (intensive agriculture)
- Western UP (sugarcane, wheat)
- Vidarbha (cotton, soybean)
- Marathwada (pulses, millets)
- Western Maharashtra (sugarcane, grapes)
- Karnataka Plateau (ragi, pulses)
- Tamil Nadu Plains (rice, groundnut)
- Andhra Pradesh Coastal (rice, aquaculture)
- Telangana (cotton, maize)

### Urban Centers (Flagged)
- Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad

### Protected/Forest Regions (Flagged)
- Western Ghats (biodiversity hotspot)
- Eastern Ghats (forest cover)
- Himalayan Foothills (restricted zones)
- Central Indian Highlands (tribal/forest lands)

### Special Zones
- Coastal regions: Agricultural but with salinity warnings
- Desert regions: Non-agricultural unless irrigated
- High-altitude: Snow/ice coverage

## Integration with Synthesis Agent

The Synthesis Agent (Opus 4.6) receives land use validation data and:

1. **Adjusts recommendations** based on land type
2. **Highlights warnings** in the final report
3. **Suggests alternatives** if land is non-agricultural
4. **Adds risk assessments** for marginal land

Example synthesis adjustment:
> "⚠️ **Land Use Notice**: Your location is classified as [urban/forest/desert]. While our analysis proceeds with agricultural recommendations, please verify local zoning laws and environmental regulations before proceeding."

## API Integration Details

### Current Implementation: Heuristic Fallback

The current implementation uses geographic heuristics based on:
- Known agricultural regions in India
- Major city locations
- Forest reserve boundaries
- Climatic zones (desert, coastal, etc.)

**Advantages**:
- ✅ No API dependencies
- ✅ Fast response
- ✅ Covers Indian agriculture well
- ✅ Never fails

**Limitations**:
- ⚠️ Medium confidence for edge cases
- ⚠️ 500m-5km effective resolution
- ⚠️ Requires periodic updates

### Future Enhancement: Live Satellite APIs

A production implementation could integrate:

**ESA WorldCover WMS**:
```typescript
const wmsRequest = {
  service: 'WMS',
  version: '1.3.0',
  request: 'GetFeatureInfo',
  layers: 'WORLDCOVER_2021_MAP',
  query_layers: 'WORLDCOVER_2021_MAP',
  i: pixelX,
  j: pixelY,
  width: 1,
  height: 1,
};
```

**NASA MODIS AppEEARS**:
```typescript
const modisRequest = {
  task_type: 'point',
  params: {
    coordinates: [{ latitude, longitude }],
    layers: [{ product: 'MCD12Q1.006', layer: 'LC_Type1' }],
  },
};
```

## Testing

### Unit Tests
Run land use validator tests:
```bash
npm test -- orchestrator/__tests__/land-use-validator.test.ts
```

Test coverage includes:
- ✅ Agricultural regions (Vidarbha, Punjab, etc.)
- ✅ Urban areas (Mumbai, Delhi, etc.)
- ✅ Forest regions (Western Ghats)
- ✅ Desert regions (Thar Desert)
- ✅ Coastal zones
- ✅ Out-of-bounds coordinates
- ✅ Edge cases and fallback behavior

### Integration Tests
Run intake agent integration tests:
```bash
npm test -- orchestrator/__tests__/intake-agent-landuse.test.ts
```

These verify:
- ✅ Validation runs during profile creation
- ✅ Warnings are properly generated
- ✅ Non-blocking behavior
- ✅ Profile completeness

## Configuration

### Environment Variables
No special configuration required. The validator works out-of-the-box.

### Customization
To adjust validation behavior, modify:

`orchestrator/utils/land-use-validator.ts`:
- `urbanCenters`: Add/update city locations
- `agriculturalRegions`: Define agricultural belts
- `forestRegions`: Protected area boundaries

## Monitoring and Logging

The validator logs all validations:

```
[LandUseValidator] Validating land use for 20.5, 78.5
[LandUseValidator] Using heuristic validation: cropland
[IntakeAgent] Land use: cropland (agricultural: true, source: agricultural_belt_heuristics)
```

For non-agricultural land:
```
[IntakeAgent] Land use warning: This location appears to be in or near Mumbai (urban area). Commercial agriculture may not be feasible in densely populated urban zones.
```

## Best Practices

### For Development
1. Always test with diverse coordinates (urban, rural, coastal, desert)
2. Verify warnings are user-friendly
3. Ensure non-blocking behavior is maintained
4. Log validation outcomes for debugging

### For Production
1. Monitor validation coverage metrics
2. Update heuristic boundaries quarterly
3. Consider integrating live satellite APIs for high-value use cases
4. Collect user feedback on false positives/negatives

## Troubleshooting

### "Land use validation unavailable"
- Expected when APIs are down
- Heuristic fallback should engage
- System continues normally

### "Outside India" warning
- Verify coordinates are in lat: 8-35°N, lng: 68-97°E
- Check for coordinate swap (lat/lng reversed)

### False positives (agricultural flagged as urban)
- Review heuristic boundaries in validator
- Submit feedback for boundary adjustment

### Low confidence classifications
- Common for less-defined regions
- System proceeds with caution
- Recommendations include verification advice

## Future Enhancements

1. **Live Satellite Integration**: Connect to ESA WorldCover WMS API
2. **Historical Analysis**: Track land use changes over time
3. **Soil Quality Integration**: Cross-reference with soil data
4. **State-Level Rules**: Add zoning regulations by state
5. **Farmer Feedback**: Allow users to confirm/correct classifications
6. **ML Classification**: Train model on Indian agricultural patterns

## References

- [ESA WorldCover](https://worldcover2021.esa.int/)
- [NASA MODIS Land Cover](https://lpdaac.usgs.gov/products/mcd12q1v006/)
- [OpenLandMap](https://openlandmap.org/)
- [ISRO Bhuvan](https://bhuvan.nrsc.gov.in/) (potential future integration)
