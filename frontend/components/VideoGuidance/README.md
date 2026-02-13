# VideoGuidance Component System

## Quick Start

```tsx
import VideoGuidanceSession from '@/components/VideoGuidance/VideoGuidanceSession';

<VideoGuidanceSession
  sessionId="unique-session-id"
  location={{ lat: 20.5, lon: 77.0 }}
  onComplete={(assessmentId) => console.log('Done:', assessmentId)}
  onCancel={() => console.log('Cancelled')}
/>
```

## File Structure

```
VideoGuidance/
├── VideoGuidanceSession.tsx   - Main orchestrator (use this!)
├── CameraCapture.tsx          - Camera interface
├── QualityOverlay.tsx         - Quality feedback
├── ProgressTracker.tsx        - Step progress
├── captureSteps.ts            - Step configuration
├── hooks/
│   ├── useVideoStream.ts      - Camera management
│   ├── useImageQuality.ts     - Quality analysis
│   └── useImageUpload.ts      - API upload
└── README.md                  - This file
```

## Components

### VideoGuidanceSession (Main Entry Point)
The complete capture workflow. Just pass sessionId, location, and callbacks.

### CameraCapture
Full-screen camera interface with quality feedback. Handles permissions, preview, capture.

### QualityOverlay
Colored border overlay (green/yellow/red) with real-time quality score.

### ProgressTracker
Visual progress bar and step indicators.

## Hooks

### useVideoStream
```tsx
const { videoRef, startStream, captureFrame, stopStream } = useVideoStream({
  preferredCamera: 'environment' // rear camera
});
```

### useImageQuality
```tsx
const { analyzeQuality, isAnalyzing } = useImageQuality();
const quality = await analyzeQuality(imageDataUrl);
// quality.score: 0-100
// quality.feedback: "Excellent quality!"
```

### useImageUpload
```tsx
const { uploadImages, uploading, progress } = useImageUpload();
const result = await uploadImages(images, sessionId, location);
// result.assessmentId: string
```

## Capture Steps

1. **Soil Sample 1** (Required) - Close-up
2. **Soil Sample 2** (Required) - Different location
3. **Crop Leaves** (Optional) - Leaf health
4. **Field Overview** (Optional) - Wide shot

## Integration Example

```tsx
// In your form component
import dynamic from 'next/dynamic';

const VideoGuidanceSession = dynamic(
  () => import('./VideoGuidance/VideoGuidanceSession'),
  { ssr: false }
);

function MyForm() {
  const [showGuidance, setShowGuidance] = useState(false);
  const [visualAssessmentId, setVisualAssessmentId] = useState<string | null>(null);

  return (
    <>
      <button onClick={() => setShowGuidance(true)}>
        📸 Take Photos
      </button>

      {showGuidance && (
        <VideoGuidanceSession
          sessionId={`temp-${Date.now()}`}
          location={coordinates}
          onComplete={(id) => {
            setVisualAssessmentId(id);
            setShowGuidance(false);
          }}
          onCancel={() => setShowGuidance(false)}
        />
      )}

      {visualAssessmentId && (
        <div>✓ Visual Assessment Complete!</div>
      )}
    </>
  );
}
```

## API Endpoint

The system uploads to:
```
POST /api/visual-assessment
Content-Type: multipart/form-data

FormData:
- soilImages: File[]
- cropImages: File[]
- fieldImages: File[]
- sessionId: string
- latitude: string
- longitude: string
- capturedAt: string (ISO date)
```

## Quality Scoring

- **80-100**: Excellent (green border, pulsing capture button)
- **60-79**: Good (yellow border, enabled button)
- **0-59**: Poor (red border, disabled button)

**Metrics**:
- Brightness (40% weight)
- Sharpness (40% weight)
- File size (20% weight)

## Mobile Optimization

- Rear camera preferred (`facingMode: 'environment'`)
- `playsInline` prevents iOS fullscreen
- 48px minimum touch targets
- Images compressed to <200KB
- Progress feedback during upload

## Error Handling

- Permission denied → Instructions + retry
- No camera → Skip or cancel options
- Upload fails → Retry with saved images
- Network timeout → Error message + retry

## Browser Support

- Chrome/Edge (desktop & mobile)
- Safari (desktop & iOS)
- Firefox (desktop & mobile)

Requires `navigator.mediaDevices.getUserMedia` support.

## Performance

- Quality analysis: ~50ms per frame
- Image compression: ~200ms per image
- Upload: ~2-3s for 4 images (3G)

## Troubleshooting

**Camera won't start**: Check browser permissions
**Black screen on iOS**: Ensure `playsInline` on video
**Poor quality always**: Improve lighting
**Upload fails**: Check network, retry

## Testing

Run TypeScript check:
```bash
npm run type-check
```

Test on mobile:
1. Enable remote debugging
2. Test camera access
3. Verify image quality
4. Test upload flow

## Dependencies

- React 18+
- Next.js 14+
- TypeScript 5+
- Tailwind CSS 3+

No external camera libraries required!

## License

Part of KisanMind project - Agricultural Intelligence Platform
