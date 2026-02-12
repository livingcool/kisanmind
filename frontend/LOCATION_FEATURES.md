# Location Input and Geocoding Features

## Overview

The KisanMind frontend implements sophisticated location handling with automatic address resolution using OpenStreetMap's Nominatim geocoding API. This enables farmers to input their location either by:
1. Searching for an address
2. Entering coordinates directly (latitude, longitude)
3. Using their current GPS location

All methods automatically resolve to detailed address information and display the location on an interactive map.

## Components

### LocationInput Component
**File**: `frontend/components/LocationInput.tsx`

#### Features
- **Dual Input Method**: Accepts both address search queries and coordinate pairs
- **Automatic Reverse Geocoding**: Converts coordinates to full address details
- **Automatic Forward Geocoding**: Converts address search to coordinates
- **Current Location**: GPS-based location detection via browser Geolocation API
- **Rate Limiting**: Enforces 1-second delay between API calls (Nominatim requirement)
- **Loading States**: Visual feedback for all geocoding operations
- **Error Handling**: Graceful fallback when geocoding fails

#### Props Interface
```typescript
interface LocationInputProps {
  coordinates: Coordinates | null;
  address: string;
  onCoordinatesChange: (coords: Coordinates | null) => void;
  onAddressChange: (address: string) => void;
  onAddressDetailsChange: (details: AddressDetails | null) => void;
  error?: string;
}
```

#### Usage Example
```tsx
import LocationInput from '@/components/LocationInput';

const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
const [address, setAddress] = useState('');
const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null);

<LocationInput
  coordinates={coordinates}
  address={address}
  onCoordinatesChange={setCoordinates}
  onAddressChange={setAddress}
  onAddressDetailsChange={setAddressDetails}
  error={errors.location}
/>
```

### LocationMap Component
**File**: `frontend/components/LocationMap.tsx`

Displays the selected location on an interactive Leaflet map with custom agricultural-themed markers.

#### Props
```typescript
interface LocationMapProps {
  coordinates: { lat: number; lon: number };
  address?: string;
  height?: string;
  showSatellite?: boolean;
  zoom?: number;
}
```

## Type Definitions

**File**: `frontend/lib/location-types.ts`

### AddressDetails Interface
```typescript
interface AddressDetails {
  road?: string;              // Street name
  suburb?: string;            // Suburb/locality
  neighbourhood?: string;     // Neighbourhood
  city?: string;              // City name
  town?: string;              // Town name (for rural areas)
  village?: string;           // Village name
  district?: string;          // District/county
  county?: string;            // County
  state?: string;             // State/province
  postcode?: string;          // PIN/postal code
  country?: string;           // Country name
  country_code?: string;      // ISO country code
}
```

### Coordinates Interface
```typescript
interface Coordinates {
  lat: number;
  lon: number;
}
```

## Geocoding API Integration

### Nominatim OpenStreetMap API

#### Base URL
`https://nominatim.openstreetmap.org`

#### Required Headers
```typescript
headers: {
  'User-Agent': 'KisanMind/1.0 (Agricultural Advisory App)',
}
```

#### Reverse Geocoding
Converts coordinates to address:
```
GET /reverse?lat={lat}&lon={lon}&format=json&addressdetails=1
```

**Example Response**:
```json
{
  "lat": "20.5937",
  "lon": "78.9629",
  "display_name": "Vidarbha, Maharashtra, India",
  "address": {
    "city": "Nagpur",
    "district": "Nagpur",
    "state": "Maharashtra",
    "postcode": "440001",
    "country": "India",
    "country_code": "in"
  }
}
```

#### Forward Geocoding
Converts address to coordinates:
```
GET /search?q={query}&format=json&addressdetails=1&countrycodes=in&limit=1
```

**Parameters**:
- `q`: Search query (address)
- `format`: Response format (json)
- `addressdetails`: Include address breakdown (1)
- `countrycodes`: Limit to India (in)
- `limit`: Maximum results (1)

**Example Response**:
```json
[
  {
    "lat": "20.5937",
    "lon": "78.9629",
    "display_name": "Vidarbha, Maharashtra, India",
    "address": {
      "city": "Nagpur",
      "state": "Maharashtra",
      "country": "India"
    }
  }
]
```

## Rate Limiting Implementation

Nominatim requires a maximum of 1 request per second. The implementation enforces this:

```typescript
const [lastApiCall, setLastApiCall] = useState<number>(0);
const MIN_API_DELAY = 1000; // 1 second

const makeApiCall = async () => {
  // Calculate time since last call
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;

  // Wait if needed
  if (timeSinceLastCall < MIN_API_DELAY) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_API_DELAY - timeSinceLastCall)
    );
  }

  // Make API call
  const response = await fetch(url, { headers });
  setLastApiCall(Date.now());

  return response;
};
```

## Debouncing for Address Search

Address search is debounced to prevent excessive API calls:

```typescript
const debouncedForwardGeocode = useCallback(
  debounce((query: string) => forwardGeocode(query), 1000),
  []
);
```

This ensures the API is only called after the user stops typing for 1 second.

## Coordinate Input Parsing

The component accepts coordinates in multiple formats:
- `20.5937, 78.9629` (with space)
- `20.5937,78.9629` (without space)
- Negative coordinates: `-20.5937, -78.9629`

**Regex Pattern**:
```typescript
const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
```

## Address Display Format

The detailed address is displayed in a structured format:

```
📍 Exact Location:
Street: [road/suburb]
Area: [neighbourhood/locality]
City: [city/town/village]
District: [district/county]
State: [state]
PIN: [postcode]
Coordinates: [lat, lon] (6 decimal places)
```

## Error Handling

### Geocoding Failures
If reverse/forward geocoding fails:
- Display coordinates only (fallback)
- Log error to console
- Continue with partial data
- No user-facing error (graceful degradation)

### Geolocation Errors
If GPS location fails:
- Browser doesn't support geolocation
- User denies permission
- Position unavailable
- Timeout

The component handles these silently and leaves the input empty.

## Performance Optimizations

1. **Rate Limiting**: Prevents API throttling
2. **Debouncing**: Reduces unnecessary API calls during typing
3. **Automatic Triggering**: Only geocode when coordinates actually change
4. **Caching**: Form data saved to localStorage includes address details

## Integration with FarmerInputForm

The LocationInput is integrated into the main form:

```tsx
<LocationInput
  coordinates={coordinates}
  address={location}
  onCoordinatesChange={setCoordinates}
  onAddressChange={setLocation}
  onAddressDetailsChange={setAddressDetails}
  error={errors.location}
/>

{/* Display detailed address and map when coordinates available */}
{coordinates && addressDetails && (
  <LocationPreviewCard
    coordinates={coordinates}
    address={location}
    addressDetails={addressDetails}
  />
)}
```

## Testing

### Manual Test Cases

1. **Current Location Button**:
   - Click "Current Location" button
   - Grant location permission
   - Verify coordinates and address appear
   - Verify map shows correct location

2. **Coordinate Input**:
   - Enter: `20.5937, 78.9629`
   - Verify address details appear automatically
   - Verify map marker appears

3. **Address Search**:
   - Enter: "Vidarbha Maharashtra"
   - Wait for search to complete
   - Verify coordinates and address details appear
   - Verify map shows location

4. **Rate Limiting**:
   - Rapidly change coordinates multiple times
   - Verify API calls are spaced 1 second apart
   - Check browser DevTools Network tab

5. **Error Handling**:
   - Enter invalid coordinates: `999, 999`
   - Verify graceful handling
   - Enter gibberish address
   - Verify no crashes

## Future Enhancements

1. **Offline Mode**: Cache previous locations for offline use
2. **Location History**: Save recently used locations
3. **Map Markers**: Add soil type, water source markers
4. **Satellite Toggle**: Toggle between street/satellite view from input
5. **Address Autocomplete**: Show suggestions while typing
6. **Regional Language**: Display addresses in local language

## References

- [Nominatim API Documentation](https://nominatim.org/release-docs/latest/api/Overview/)
- [Leaflet.js Documentation](https://leafletjs.com/)
- [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [OpenStreetMap](https://www.openstreetmap.org/)
