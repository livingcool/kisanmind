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
- Nested translation keys for organization

### 2. Mobile-First Design Principles
- All touch targets minimum 48x48px
- Large fonts (text-base = 16px minimum)
- High contrast colors for rural lighting conditions

### 3. API Integration Strategy
- Graceful fallback to mock data when backend unavailable
- Error states show helpful messages, not technical jargon

### 4. Leaflet Map Integration
- Always use `dynamic()` import with `ssr: false`
- Import Leaflet CSS in `app/layout.tsx`
- Use divIcon for custom markers

### 5. Video Guidance System (NEW - Feb 2026)
- **Location**: `components/VideoGuidance/`
- **Purpose**: Capture 2 soil + 2 optional crop/field images
- **Components**: VideoGuidanceSession, CameraCapture, QualityOverlay, ProgressTracker
- **Hooks**: useVideoStream, useImageQuality, useImageUpload
- **Integration**: Added to FarmerInputForm as optional "Take Photos" button
- **API**: Added `visualAssessmentId` to FarmerInput interface

### 6. Camera Handling (NEW)
- Use `facingMode: 'environment'` for rear camera on mobile
- Handle permission errors with user-friendly messages
- Always stop tracks in useEffect cleanup
- Use canvas `drawImage()` + `toDataURL()` for capture
- Compress images to <200KB before upload

## File Organization
- Pages: `app/{route}/page.tsx`
- Components: `components/{ComponentName}.tsx`
- Feature Components: `components/{Feature}/{ComponentName}.tsx`
- Hooks: `components/{Feature}/hooks/use{Hook}.ts`
- Utilities: `lib/{utility}.ts`

## Video Guidance Workflow
1. Farmer enters location
2. "Take Photos" card appears
3. VideoGuidanceSession opens (fullscreen)
4. CameraCapture for each of 4 steps
5. Real-time quality overlay (green/yellow/red)
6. Review screen shows all captured images
7. Upload with progress bar
8. Success → visualAssessmentId saved
9. Green badge shows "Visual Assessment Complete!"

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
