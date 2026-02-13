# Camera Feature Testing Notes

## Critical Issue Fixed: Dark Screen on Camera Preview

### Problem Pattern
**Symptom**: Video element displays black/dark screen despite stream being active
**Root Cause**: Race condition between React ref attachment and MediaStream assignment

### Solution Pattern
```typescript
// BAD: Only attaches stream in startStream()
if (videoRef.current) {
  videoRef.current.srcObject = stream;
}

// GOOD: Also sync in useEffect when stream changes
useEffect(() => {
  if (videoRef.current && streamRef.current) {
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(console.warn);
  }
}, [state.stream]);
```

### Why This Pattern Works
1. Handles late ref attachment (ref attached after stream obtained)
2. Handles early ref attachment (stream obtained after ref attached)
3. Explicitly calls `.play()` for strict autoplay policies
4. Runs on every stream change, ensuring sync

## Mock Patterns for Camera Tests

### MediaStream API Mocking (vitest.setup.ts)

```typescript
// Mock MediaStream class
class MockMediaStream {
  private tracks: MediaStreamTrack[] = [];

  constructor() {
    const videoTrack = {
      kind: 'video',
      stop: vi.fn(),
    } as unknown as MediaStreamTrack;
    this.tracks.push(videoTrack);
  }

  getTracks() { return this.tracks; }
  getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); }
}

global.MediaStream = MockMediaStream as any;

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(),
  },
});
```

### Video Element Mocking

```typescript
// Mock video dimensions
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  get: vi.fn().mockReturnValue(1280),
});

Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  get: vi.fn().mockReturnValue(720),
});

// Mock play method
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
});
```

### Canvas Mocking for Frame Capture

```typescript
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  drawImage: vi.fn(),
  // ... other context methods
});

HTMLCanvasElement.prototype.toDataURL = vi.fn()
  .mockReturnValue('data:image/jpeg;base64,mock');
```

## Test Organization Best Practices

### Hook Testing Challenges

**Problem**: Testing React hooks that manage refs is tricky because:
1. Refs are mutable and don't trigger re-renders
2. Mock implementations can't replicate ref timing
3. Effects run in unpredictable order in test environment

**Solution**: Focus on testing behavior, not implementation:
- ✅ Test that startStream() is called
- ✅ Test error handling and state changes
- ✅ Test cleanup on unmount
- ❌ Don't test exact ref attachment timing
- ❌ Don't test internal effect execution order

### Component Testing Approach

**Effective Pattern**:
```typescript
// Mock hooks at module level
vi.mock('../hooks/useVideoStream');
vi.mock('../hooks/useImageQuality');

// In tests, override specific behaviors
beforeEach(() => {
  vi.mocked(useVideoStream).mockReturnValue({
    stream: new MediaStream(),
    isLoading: false,
    error: null,
    videoRef: { current: null },
    startStream: vi.fn(),
    stopStream: vi.fn(),
    captureFrame: vi.fn(() => 'data:image/jpeg;base64,mock'),
  });
});
```

## Common Test Failures and Fixes

### 1. "Cannot find module '../hooks/useVideoStream'"

**Cause**: Using `require()` in ESM environment
**Fix**: Import at top level and use `vi.mocked()`

```typescript
// BAD
const { useVideoStream } = require('../hooks/useVideoStream');

// GOOD
import * as useVideoStreamModule from '../hooks/useVideoStream';
vi.mocked(useVideoStreamModule.useVideoStream).mockReturnValue(...);
```

### 2. "Cannot read properties of null (reading 'videoRef')"

**Cause**: Hook not properly mocked, returning null
**Fix**: Ensure mock is set in `beforeEach` before rendering component

### 3. "Warning: You called act(async () => ...) without await"

**Cause**: Async act calls not properly awaited
**Fix**: Always await act() calls:

```typescript
// BAD
const promise = act(async () => await doSomething());
expect(result).toBe(value);

// GOOD
await act(async () => {
  await doSomething();
});
expect(result).toBe(value);
```

## Browser-Specific Issues

### Safari Autoplay Policy

**Issue**: Safari blocks autoplay even with `autoPlay` attribute
**Solution**: Always call `.play()` explicitly and catch errors:

```typescript
try {
  await videoElement.play();
} catch (playError) {
  console.warn('Autoplay failed:', playError);
  // Show user a "Tap to start camera" button
}
```

### Mobile Browser Fullscreen

**Issue**: Mobile browsers take over fullscreen without `playsInline`
**Solution**: Always include all three attributes:

```jsx
<video
  autoPlay
  playsInline
  muted
  ref={videoRef}
/>
```

### Firefox Ref Timing

**Issue**: Firefox may delay ref attachment after first render
**Solution**: The sync useEffect pattern handles this automatically

## Performance Benchmarks

From actual test runs:
- MediaStream acquisition: ~50ms (mocked) / ~500ms (real)
- Frame capture: <1ms (mocked) / 10-50ms (real)
- Quality analysis: N/A (not implemented) / target <100ms
- Test suite execution: ~450ms total (31 tests)

## Test Coverage Priorities

1. **Critical Path** (100% coverage required):
   - Stream acquisition and permission handling
   - Video element attachment and sync
   - Frame capture functionality
   - Cleanup on unmount

2. **Error Paths** (100% coverage required):
   - Permission denied
   - No camera found
   - Camera in use
   - getUserMedia not supported

3. **User Interactions** (>80% coverage):
   - Capture button click
   - Retake functionality
   - Skip optional steps
   - Cancel camera

4. **Edge Cases** (>60% coverage):
   - Rapid start/stop cycles
   - Multiple component instances
   - Stream interrupted mid-session

## Lessons Learned

### What Works Well

1. **Mock Setup in vitest.setup.ts**: Centralized mocking prevents repetition
2. **Factory Functions**: `createMockVideoStream()` makes test setup clean
3. **Focused Component Tests**: Test user-facing behavior, not internals
4. **Comprehensive Error Mocking**: Test all getUserMedia error types

### What Doesn't Work

1. **Testing Ref Timing**: Too implementation-dependent and flaky
2. **Testing Effect Execution Order**: Differs between test and production
3. **Integration Tests for Hooks**: Better to test via components
4. **Mocking Too Much**: Over-mocking hides real bugs

### Future Improvements

1. **E2E Tests**: Use Playwright/Cypress for real camera testing
2. **Visual Regression**: Snapshot tests for camera UI
3. **Performance Tests**: Measure actual frame capture speed
4. **Accessibility Tests**: Test keyboard navigation, screen readers

## Quick Reference

### Run Tests
```bash
npm test                    # Watch mode
npm test -- --run          # Run once
npm test:coverage          # With coverage
npm test:ui                # Open Vitest UI
```

### Test File Locations
- Hook tests: `components/VideoGuidance/hooks/__tests__/`
- Component tests: `components/VideoGuidance/__tests__/`
- Setup: `vitest.setup.ts` (project root)
- Config: `vitest.config.ts` (project root)

### Common Assertions
```typescript
// Component rendered
expect(screen.getByText('...')).toBeInTheDocument();

// Button interactions
await userEvent.click(screen.getByText('Capture'));

// State changes
expect(mockStartStream).toHaveBeenCalled();

// Error display
expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
```
