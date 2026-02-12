# Frontend Builder Memory

## Project Structure
- **Location**: `E:/2026/Claude-Hackathon/kisanmind/frontend/`
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom agricultural theme

## Key Architectural Decisions

### 1. Multi-Language Support (i18next)
- Translation files in `public/locales/{lang}/translation.json`
- 5 languages: English, Hindi, Marathi, Tamil, Telugu
- Language preference stored in localStorage
- Nested translation keys for organization (e.g., `input.waterSources.borewell`)

### 2. Mobile-First Design Principles
- All touch targets minimum 48x48px
- Forms optimized for vertical smartphone screens
- Large fonts (text-base = 16px minimum)
- High contrast colors for rural lighting conditions
- Network optimization for 3G/4G connections

### 3. Component Pattern: Form State Management
- Auto-save to localStorage on every input change
- Load saved data on mount for persistence
- Validation happens on submit, not on blur (farmer-friendly)
- Clear error messages with actionable guidance

### 4. API Integration Strategy
- Graceful fallback to mock data when backend unavailable
- This enables demo mode without live orchestrator
- Error states show helpful messages, not technical jargon
- Polling pattern for long-running AI analysis

### 5. Accessibility Standards
- Semantic HTML5 throughout
- ARIA labels on all interactive elements
- Focus indicators with `focus-visible` utility
- Color contrast meets WCAG AA
- Screen reader compatible with proper heading hierarchy

### 6. Leaflet Map Integration
- **SSR Handling**: Always use `dynamic()` import with `ssr: false` for Leaflet components
- **CSS Import**: Leaflet CSS imported in `app/layout.tsx`
- **Custom Icons**: Use divIcon with inline HTML/CSS for agricultural theme (green pin)
- **Z-index**: Set `.leaflet-container { z-index: 0 }` in globals.css
- **Tile Layers**: OpenStreetMap for street view, Esri for satellite imagery
- **Loading State**: Include loading spinner in dynamic import options

### 7. Geocoding and Reverse Geocoding (Nominatim API)
- **API**: OpenStreetMap Nominatim (free, no API key required)
- **Rate Limiting**: 1 request per second (enforce with timestamp tracking)
- **User-Agent**: Required header `'User-Agent': 'KisanMind/1.0 (Agricultural Advisory App)'`
- **Forward Geocoding**: `/search?q={query}&format=json&addressdetails=1&countrycodes=in`
- **Reverse Geocoding**: `/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1`
- **Auto-Trigger**: Reverse geocode automatically when coordinates are entered or updated
- **Debouncing**: Use 1s debounce for address search to prevent rate limit violations
- **Type Safety**: Created `lib/location-types.ts` with `AddressDetails`, `GeocodingResult`, `Coordinates` interfaces

## Reusable Component Patterns

### Form Inputs
- Always include label with `htmlFor` matching input `id`
- Required fields marked with red asterisk
- Helper text below input with Info icon
- Error messages in red below helper text

### LocationInput Component Pattern (NEW)
- **File**: `components/LocationInput.tsx`
- **Features**:
  - Dual input: accepts address search OR lat/lon coordinates
  - Auto reverse-geocode on coordinate entry
  - Auto forward-geocode on address search (debounced)
  - Current location button with geolocation API
  - Rate-limited API calls (1 req/sec for Nominatim)
  - Loading states for all geocoding operations
- **Props**:
  - `coordinates`: Current lat/lon
  - `address`: Current address string
  - `onCoordinatesChange`: Callback for coordinate updates
  - `onAddressChange`: Callback for address updates
  - `onAddressDetailsChange`: Callback for structured address data
  - `error`: Optional error message
- **Integration**: Use with parent form state, not standalone

### Button Design
```tsx
className="min-h-touch px-6 py-3 bg-primary-600 text-white font-semibold
  rounded-lg hover:bg-primary-700 transition-colors"
```

### Card Layout
```tsx
className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
```

### Location Preview Card Pattern (ENHANCED)
```tsx
{coordinates && (
  <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 shadow-md">
    {/* Header with copy button */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
          <Map className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-base font-bold text-green-800">Exact Location</h3>
      </div>
      <button onClick={handleCopyAddress} className="p-2 bg-white rounded-lg">
        {copiedAddress ? <Check /> : <Copy />}
      </button>
    </div>

    {/* Detailed address breakdown (from reverse geocoding) */}
    {addressDetails && (
      <div className="bg-white rounded-lg p-4 border space-y-2">
        <div className="flex text-sm">
          <span className="font-semibold w-24">Street:</span>
          <span>{addressDetails.road}</span>
        </div>
        {/* Additional fields: area, city, district, state, PIN, coordinates */}
      </div>
    )}

    {/* Map preview */}
    <LocationMap coordinates={coordinates} address={address} height="200px" />
  </div>
)}
```

## Tailwind Custom Classes

### Color Palette
- **Primary**: Green shades (primary-50 to primary-900) for agriculture theme
- **Earth**: Brown tones for soil-related elements
- **Water**: Blue tones for water-related elements

### Touch Targets
- `min-h-touch`: 48px minimum height
- `min-w-touch`: 48px minimum width

## i18n Key Naming Convention
```
{section}.{subsection}.{key}
Examples:
- input.waterSources.borewell
- results.sections.recommendedCrop
- errors.networkError
```

## File Organization
- **Pages**: `app/{route}/page.tsx` (Next.js App Router)
- **Components**: `components/{ComponentName}.tsx`
- **Utilities**: `lib/{utility}.ts`
- **Type Definitions**: `lib/{feature}-types.ts` (e.g., `location-types.ts`)
- **Translations**: `public/locales/{lang}/translation.json`

## Common Issues & Solutions

### Leaflet Map in Next.js (UPDATED)
1. **Dynamic Import Pattern**:
```tsx
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

2. **Custom Marker Icons**:
```tsx
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="...">...</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
```

3. **CSS Setup**:
- Import in layout: `import 'leaflet/dist/leaflet.css';`
- Add z-index fix in globals.css
- Set map container style with inline height

4. **Cleanup**:
```tsx
useEffect(() => {
  // Map initialization
  return () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };
}, [dependencies]);
```

### Speech Recognition Browser Support
- Check for `SpeechRecognition` or `webkitSpeechRecognition`
- Set language to `en-IN` for Indian English
- Provide fallback message if not supported

### Form Persistence Pattern
```tsx
// Save on every change
useEffect(() => {
  saveToLocalStorage('key', formData);
}, [formData]);

// Load on mount
useEffect(() => {
  const saved = loadFromLocalStorage('key');
  if (saved) setFormData(saved);
}, []);
```

### Geocoding Rate Limiting Pattern
```tsx
const [lastApiCall, setLastApiCall] = useState<number>(0);
const MIN_API_DELAY = 1000; // 1 second

const makeApiCall = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  if (timeSinceLastCall < MIN_API_DELAY) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_API_DELAY - timeSinceLastCall)
    );
  }
  // Make API call
  setLastApiCall(Date.now());
};
```

## API Response Handling
- Always wrap API calls in try-catch
- Log errors for debugging but show user-friendly messages
- Provide mock data fallback for demo purposes
- Use TypeScript interfaces for all API responses

## Testing Checklist
- [ ] Test on 360px mobile viewport
- [ ] Verify touch targets are large enough
- [ ] Check color contrast ratios
- [ ] Test keyboard navigation
- [ ] Verify all languages load correctly
- [ ] Test with slow 3G throttling
- [ ] Check print styles for PDF generation

## Performance Optimizations Applied
1. Dynamic imports for heavy components (maps)
2. Image optimization with Next.js Image
3. Code splitting by route
4. LocalStorage caching for form data
5. Debounced search inputs

## Links to Detailed Docs
- See `frontend/README.md` for full setup instructions
- See `lib/api.ts` for API integration patterns
- See `components/` for component usage examples
