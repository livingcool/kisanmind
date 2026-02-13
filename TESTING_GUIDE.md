# KisanMind Testing Guide

## Quick Start

### Run All Tests

```bash
# Backend tests (MCP servers)
npm test

# Frontend tests
cd frontend
npm test

# With coverage
npm test:coverage

# Open Vitest UI (frontend only)
npm test:ui
```

## Manual Testing - Camera Fix Verification

### Prerequisites

1. A device with a working camera (laptop webcam or mobile phone)
2. Browser with camera support (Chrome, Firefox, Safari, Edge)
3. Frontend running: `cd frontend && npm run dev`

### Test Procedure

#### Step 1: Access Visual Assessment

1. Open browser to `http://localhost:3000`
2. Fill in farmer input form:
   - Select location (Vidarbha, Maharashtra recommended)
   - Enter land size (e.g., 3 acres)
   - Select water source (e.g., Borewell)
   - Choose previous crop (e.g., Cotton)
3. Click "Add Visual Assessment" button

#### Step 2: Verify Camera Permission

**Expected Behavior:**
- Browser prompts for camera permission
- Loading indicator appears: "Starting camera..."
- Loading text: "Please allow camera access when prompted"

**Action:**
- Click "Allow" on browser permission prompt

**If permission denied:**
- Error screen should appear: "Camera Access Required"
- Error message: "Camera permission denied..."
- "Try Again" button should be visible
- Click "Try Again" to retry permission request

#### Step 3: Verify Live Camera Preview

**Expected Behavior (FIXED):**
- ✅ Live video feed appears (NOT black screen)
- ✅ Video shows real-time camera output
- ✅ Video is correctly sized and positioned
- ✅ Quality guidance tips panel appears

**What Was Broken:**
- ❌ Black/dark screen with no video
- ❌ Camera active light on but no preview

**Visual Checks:**
- Video element shows live camera feed
- Frame rate is smooth (not choppy)
- No visible lag or freezing
- Tips panel overlays the video correctly

#### Step 4: Test Quality Guidance

**Expected Behavior:**
- Tips panel visible with "📸 Tips for Best Results"
- Step-specific tips listed (e.g., "Avoid shadows on the soil")
- Close button (X) in tips panel
- Click X to hide tips
- "Show Tips" button appears after hiding

**Test Actions:**
1. Read the quality tips
2. Click X to close tips panel
3. Verify tips panel disappears
4. Verify "Show Tips" button appears
5. Click "Show Tips" to restore panel

#### Step 5: Test Image Capture

**Expected Behavior:**
- Large circular capture button at bottom
- Camera icon visible in button
- Button becomes green/pulsing when quality is good
- Button disabled (grayed out) when quality is poor

**Test Actions:**
1. Point camera at well-lit soil sample
2. Wait for capture button to turn green (quality acceptable)
3. Click capture button
4. Video stream should stop
5. Preview screen should appear with captured image

**Quality Scenarios to Test:**
- **Good lighting**: Button should be enabled, green/pulsing
- **Low light**: Button may be disabled, gray
- **Blurry**: Button may be disabled
- **Proper distance**: Button enabled

#### Step 6: Verify Preview and Retake

**Expected Behavior:**
- "Preview" header appears
- Captured image displays clearly
- Two buttons at bottom:
  - "Retake" (left, white background)
  - "Confirm" (right, green background)

**Test Actions:**
1. Verify image quality in preview
2. Click "Retake" to recapture
   - Should return to live camera view
   - Should restart video stream
3. Capture another image
4. Click "Confirm" to accept image
   - Should return to guidance session
   - Image should be added to captured images

#### Step 7: Test Multiple Images

**Expected Behavior:**
- Progress tracker shows completed steps
- Can capture multiple images (Soil 1, Soil 2, Crop, Field)
- Optional steps show "Skip" button
- Required steps don't show "Skip" button

**Test Actions:**
1. Complete Soil Sample 1 (required)
2. Verify next step automatically appears (Soil Sample 2)
3. Complete Soil Sample 2 (required)
4. Test optional step: Click "Skip" for crop leaves
5. Verify session advances to next step

#### Step 8: Test Upload

**Expected Behavior:**
- "Upload & Continue" button appears after required images captured
- Button shows count: "Upload & Continue (2 images)"
- Click button to upload
- Upload progress screen appears
- Progress bar animates 0% → 100%
- Success message: "Upload Successful!"

#### Step 9: Test Cancel and Error Recovery

**Test Actions:**
1. Click X (cancel) button during camera capture
   - Should return to main form
   - Camera should stop (check camera light)
2. Deny camera permission
   - Should show error screen
   - "Try Again" button should work
3. Disconnect camera mid-session (if possible)
   - Should show appropriate error

### Browser-Specific Testing

#### Chrome/Edge (Chromium)
- ✅ Should work perfectly
- ✅ Fast camera initialization
- ✅ Smooth preview

#### Firefox
- ✅ Should work with slight delay on first frame
- ⚠️ May show black frame briefly before video appears (this is normal)

#### Safari (macOS/iOS)
- ✅ Should work with explicit user interaction
- ⚠️ May require tap to start video on iOS
- ✅ `playsInline` prevents fullscreen takeover

#### Mobile Browsers
- ✅ Should prefer rear camera (environment)
- ✅ Should maintain aspect ratio
- ✅ Touch-friendly button sizes (min-h-touch, min-w-touch)

### Performance Expectations

| Metric | Expected | Acceptable | Poor |
|--------|----------|------------|------|
| Camera start | <1 second | 1-2 seconds | >2 seconds |
| Frame capture | Instant | <100ms | >200ms |
| Preview transition | Instant | <50ms | >100ms |
| Upload (2 images) | 2-5 seconds | 5-10 seconds | >10 seconds |

### Known Limitations

1. **Brief Black Frame on Firefox**: Firefox may show 1-2 black frames before video starts (browser behavior, not a bug)
2. **Safari Autoplay**: Safari may require user tap even with autoplay attribute (security feature)
3. **Mobile Performance**: Older devices may have slower camera initialization
4. **Canvas Memory**: Capturing many high-res images may cause memory warnings (normal)

## Automated Testing

### Run Camera Tests Only

```bash
cd frontend
npm test -- CameraCapture  # Run CameraCapture tests
npm test -- useVideoStream # Run useVideoStream tests
```

### Test Coverage

```bash
cd frontend
npm test:coverage -- --reporter=html
# Open coverage/index.html in browser
```

**Current Coverage:**
- CameraCapture Component: 100% (8/8 tests passing)
- useVideoStream Hook: ~60% (behavior tests passing, implementation tests need refactor)

### Debug Failing Tests

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test -- components/VideoGuidance/__tests__/CameraCapture.test.tsx

# Run with Vitest UI for debugging
npm test:ui
```

## Troubleshooting

### Camera Permission Issues

**Symptom**: Camera permission prompt doesn't appear

**Solutions**:
1. Check browser settings: `chrome://settings/content/camera`
2. Ensure HTTPS or localhost (required for getUserMedia)
3. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
4. Clear site data and retry

### Black Screen Persists

**If the black screen still appears after the fix:**

1. **Check Browser Console**: Press F12, look for errors
2. **Verify Fix Applied**:
   ```bash
   cd frontend
   git log --oneline components/VideoGuidance/hooks/useVideoStream.ts
   # Should show recent commit with camera fix
   ```
3. **Clear Build Cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```
4. **Test in Incognito**: Rules out extension conflicts

### Tests Failing

**Common causes:**
1. **Node modules outdated**: `npm install`
2. **Cache issues**: `npm test -- --clearCache`
3. **Wrong Node version**: Requires Node 18+ (check: `node --version`)

### Performance Issues

**Camera slow to start:**
- Check system resources (CPU, memory)
- Close other camera-using apps
- Try lower resolution (edit constraints in `useVideoStream.ts`)

**Frame capture laggy:**
- Reduce video resolution
- Disable quality analysis temporarily
- Check browser hardware acceleration

## Reporting Bugs

When reporting camera issues, include:

1. **Browser & Version**: Chrome 120.0, Firefox 121.0, etc.
2. **Operating System**: Windows 11, macOS 14.2, Android 13, etc.
3. **Device Type**: Laptop, desktop, phone, tablet
4. **Camera Type**: Built-in, external USB, phone (front/rear)
5. **Console Errors**: Full error messages from browser console
6. **Steps to Reproduce**: Exact sequence that triggers the issue
7. **Screenshots/Video**: If possible, record the issue

## Contributing Tests

When adding new camera features:

1. **Write tests first** (TDD approach recommended)
2. **Mock external APIs** (MediaStream, canvas, etc.)
3. **Test user behavior** (not implementation details)
4. **Cover error cases** (permissions, unsupported browsers)
5. **Update this guide** with new test procedures

### Test Template

```typescript
describe('New Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });

  it('should do expected thing when user does action', async () => {
    // Arrange
    render(<Component />);

    // Act
    await userEvent.click(screen.getByText('Button'));

    // Assert
    expect(screen.getByText('Result')).toBeInTheDocument();
  });

  it('should handle error when something fails', async () => {
    // Test error case
  });
});
```

## Resources

- [CAMERA_FIX_SUMMARY.md](./CAMERA_FIX_SUMMARY.md) - Technical details of the fix
- [Vitest Documentation](https://vitest.dev/) - Test framework docs
- [Testing Library](https://testing-library.com/react) - React testing utilities
- [MDN MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_API) - Camera API reference
