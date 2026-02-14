# Audio Guidance System Architecture

## Component Map

### Backend Services (3 microservices + API server routes)

1. **TTS Service** (`services/tts-service/`, port 8200)
   - `src/translations.ts` - 21 instruction templates x 5 languages = 105 translations
   - `src/tts-engine.ts` - Pre-generated audio files + Web Speech API fallback
   - `src/audio-cache.ts` - LRU cache (200 entries) for synthesized results
   - `src/index.ts` - Express server, warms cache on startup
   - Categories: step_instruction (7), quality_feedback (7), session_control (7)

2. **Video Quality Service** (`services/video-quality-service/`, port 8300)
   - `src/quality-analyzer.ts` - Sharp-based image analysis (resize to 320x240 for speed)
     - Blur: Laplacian variance (threshold: 100)
     - Brightness: 0-255 (acceptable: 50-200)
     - Edge density: Sobel gradient (0.03-0.40)
     - Contrast: luminance standard deviation (min: 20)
     - Score: 4 components summed to 0-100
   - `src/feedback-mapper.ts` - Throttled feedback decisions
     - Min 3s between audio feedback
     - 3 consecutive good frames for "quality_good" announcement
     - 5 consecutive bad frames to repeat warning
     - Per-session throttle state, cleaned up after 30min

3. **Video Guidance Orchestrator** (`orchestrator/video-guidance-orchestrator.ts`)
   - `VideoGuidanceOrchestrator` class with methods:
     - `startSession()` - Creates session, parallel TTS for welcome + first step
     - `processFrame()` - Quality analysis + optional TTS feedback
     - `handleCapture()` - Mark step captured, get success TTS
     - `handleSkip()` / `advanceToNextStep()` - Step progression
     - `completeSession()` - Final summary with TTS
     - `handleMessage()` - WebSocket protocol handler
   - Falls back gracefully: permissive score 70 when quality service is down

4. **API Routes** (`api-server/video-guidance-routes.ts`)
   - In-process session management (mirrors orchestrator pattern)
   - Routes: start, analyze-frame, capture, skip, next, complete, status, health
   - Proxies to TTS and quality services via fetch with 5s timeout

### Frontend (React + Next.js)

1. **AudioGuidedCapture.tsx** - Main component, full-screen camera with overlays
2. **AudioPlayer.tsx** - Floating audio indicator with mute control
3. **GuidanceQualityOverlay.tsx** - Color-coded border + badges for quality feedback
4. **ProgressTracker.tsx** - Step progress bar with icons
5. **captureSteps.ts** - 7 steps with UI metadata (icons, tips, guidance text)
6. **hooks/useAudioPlayback.ts** - Queue-based TTS playback (file + Web Speech API)
7. **hooks/useVideoGuidanceWebSocket.ts** - REST polling at 2 FPS
8. **hooks/useVideoStream.ts** - WebRTC camera management
9. **hooks/useImageQuality.ts** - Client-side quality estimation (canvas-based)
10. **hooks/useImageUpload.ts** - Image compression + upload to visual assessment API

## Data Flow

```
Frontend (AudioGuidedCapture)
  |
  |--> POST /api/guidance/session/start {farmerId, language}
  |     <-- {session, welcomeTTS, instruction}
  |
  |--> POST /api/guidance/session/:id/analyze-frame {frameData, stepId}  [2 FPS]
  |     |-> Quality Service: /api/quality/analyze-feedback
  |     |-> TTS Service: /api/tts/synthesize (if shouldSpeak)
  |     <-- {analysis, feedback, tts?}
  |
  |--> POST /api/guidance/session/:id/capture {imageData, stepId}
  |     <-- {capture_ack, tts}
  |
  |--> POST /api/guidance/session/:id/next
  |     |-> Quality Service: /api/quality/reset/:id
  |     |-> TTS Service: /api/tts/synthesize (next step instruction)
  |     <-- {step_change, step, tts, progress} | {session_complete, tts}
```

## 81 Tests (4 test suites)

- `capture-steps-config.test.ts` (20 tests) - Step definitions, utility functions
- `video-guidance-types.test.ts` (17 tests) - Type validation
- `video-guidance-orchestrator.test.ts` (28 tests) - Orchestrator logic with mocked services
- `video-guidance-routes.test.ts` (16 tests) - API route handlers with mocked services
