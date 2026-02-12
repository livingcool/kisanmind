# Video-Based Land Assessment Implementation Plan for KisanMind

**Date**: February 12, 2026
**Purpose**: Integrate real-time video guidance and ML-based land assessment to complement existing satellite-based approach

---

## Executive Summary

This plan adds **visual intelligence** to KisanMind by enabling farmers to capture proper images/videos of their land through AI-guided sessions, then using computer vision models to assess soil type, crop health, and field conditions. This bridges the accuracy gap between satellite data (70-80%) and physical lab testing (95%+), achieving **85-90% accuracy** at near-zero cost.

**Key Innovation**: Real-time voice-guided video capture system that coaches farmers in their local language to take proper images for ML analysis.

---

## Architecture Overview

### Current System (Satellite-Based)
```
Farmer Input (text/voice)
    ↓
Intake Agent → Orchestrator → [5 MCP Servers in parallel]
    ↓
Synthesis Agent → Farming Report
```

### Enhanced System (Hybrid: Satellite + Visual)
```
Farmer Input (text/voice)
    ↓
Intake Agent → Orchestrator
    ↓
┌─────────────────────────────────────────────┐
│ Parallel Intelligence Gathering              │
├──────────────────┬──────────────────────────┤
│ Satellite Layer  │  Visual Assessment Layer │
│ (5 MCP Servers)  │  (Video Guidance Agent)  │
└──────────────────┴──────────────────────────┘
    ↓
Synthesis Agent (fuses satellite + visual data)
    ↓
Enhanced Farming Report (higher confidence)
```

### Video Assessment Pipeline
```
┌─────────────────────────────────────────────────┐
│ Video Guidance Session (5-7 minutes)            │
├─────────────────────────────────────────────────┤
│ 1. Farmer opens camera in KisanMind app         │
│ 2. Voice agent speaks: "Show me your soil"      │
│ 3. Real-time quality feedback: "Move closer"    │
│ 4. Image accepted → Next task                   │
│ 5. Capture: Soil (2 photos), Crops (3 photos),  │
│             Water source (1 photo), Field (1)   │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ ML Analysis (server-side processing)            │
├─────────────────────────────────────────────────┤
│ → Soil Classification Model                     │
│ → Crop Disease Detection Model                  │
│ → Field Condition Analysis                      │
│ → Confidence Scoring & Validation               │
└─────────────────────────────────────────────────┘
    ↓
Structured Visual Intelligence Report
```

---

## Component Breakdown

### Component 1: Real-Time Video Guidance Agent

**Purpose**: Coach farmer through capture process in their language

**Technology Stack**:
- **Frontend**: Next.js + WebRTC (Simple-Peer library)
- **Voice Output**: AI4Bharat Indic-TTS (Hindi, Marathi, Tamil, Telugu)
- **Voice Input**: OpenAI Whisper Small (for farmer responses)
- **Image Quality Check**: Laplacian variance (client-side JavaScript)

**Guidance Script Flow**:
```javascript
const captureSequence = [
  {
    step: 1,
    instruction: "मिट्टी का करीब से फोटो दिखाएं", // Show soil closely
    target: "soil",
    checks: ["focus", "lighting", "distance < 30cm"],
    requiredPhotos: 2,
    feedback: {
      tooFar: "और पास जाएं", // Come closer
      blur: "फोन को स्थिर रखें", // Hold phone steady
      dark: "उजाले में जाएं", // Go to light
      good: "बहुत अच्छा! अगला", // Very good! Next
    }
  },
  {
    step: 2,
    instruction: "फसल के पत्तों का फोटो लें",
    target: "crop_leaves",
    checks: ["leafVisible", "diseaseSpotsClear"],
    requiredPhotos: 3,
    // ... feedback
  },
  // ... more steps
];
```

**Key Features**:
- **Progressive capture**: One task at a time, not overwhelming
- **Visual feedback**: Green/yellow/red border overlay on video
- **Skip option**: If farmer doesn't have certain item (e.g., no crops planted yet)
- **Offline queue**: Capture images, upload when internet available

**API Endpoints**:
- `POST /api/guidance/start` - Initialize session, get TTS audio for first instruction
- `POST /api/guidance/validate-frame` - Real-time blur/quality check
- `POST /api/guidance/submit-image` - Accept captured image, get next instruction
- `POST /api/guidance/complete` - End session, trigger ML analysis

---

### Component 2: Soil Classification Service

**Model**: OMIII1997 Soil-Type-Classification (pre-trained on Indian soils)

**GitHub**: https://github.com/OMIII1997/Soil-Type-Classification

**Input**: 2 soil photos (different angles/locations in field)

**Output**:
```json
{
  "soilType": "Black Cotton Soil",
  "confidence": 0.92,
  "texture": "Clay Loam",
  "color": "#3E3731",
  "moisture": "Moderate",
  "organicMatter": "Medium",
  "suitableFor": ["Cotton", "Soybean", "Chickpea"],
  "recommendations": [
    "Add compost to improve drainage",
    "pH likely 7-8, test before lime application"
  ],
  "comparison": {
    "satelliteData": "Black soil (SoilGrids)",
    "agreement": "HIGH",
    "note": "Visual confirms satellite assessment"
  }
}
```

**Deployment**:
- **Phase 1**: Server-side inference (Python FastAPI service)
- **Phase 2**: ONNX model on mobile (< 50MB download)

**API Endpoint**:
```
POST /api/ml/analyze-soil
Body: { images: [base64], location: {lat, lng} }
Response: SoilAnalysisResult
```

---

### Component 3: Crop Disease Detection Service

**Model (Phase 1)**: EfficientNetV2-B0 on PlantVillage dataset

**Model (Phase 2)**: RDRM-YOLO (7.9MB, 94.3% accuracy, optimized for mobile)

**GitHub (Phase 1)**: https://github.com/OmidGhadami95/EfficientNetV2B0---PlantVillage

**Input**: 3 crop leaf photos (multiple angles, different plants)

**Output**:
```json
{
  "detections": [
    {
      "disease": "Cotton Bacterial Blight",
      "confidence": 0.88,
      "severity": "Moderate",
      "affectedArea": "15-30% of leaves",
      "stage": "Early-Medium",
      "treatment": {
        "immediate": "Remove affected leaves",
        "chemical": "Streptocycline 500ppm spray",
        "organic": "Neem oil 3ml/L water",
        "cost": "₹300-500 per acre"
      },
      "yieldImpact": "-10% if untreated",
      "schemes": ["PMFBY covers disease losses"]
    }
  ],
  "overallHealth": "Fair",
  "comparisonToHealthy": "70% healthy tissue visible",
  "recommendations": [
    "Treat within 7 days to prevent spread",
    "Monitor neighboring plants",
    "Apply for PMFBY crop insurance"
  ]
}
```

**API Endpoint**:
```
POST /api/ml/analyze-crop
Body: {
  images: [base64],
  cropType: "cotton",
  growthStage: "flowering"
}
Response: CropHealthResult
```

---

### Component 4: Image Quality Assessment (Client-Side)

**Implementation**: Browser-based JavaScript (no server round-trip)

**Methods**:
1. **Blur Detection**: Laplacian variance
2. **Brightness Check**: Histogram analysis
3. **Object Detection**: Simple edge detection to confirm subject in frame

**Code Snippet** (TypeScript/React):
```typescript
// components/ImageQualityChecker.tsx
import cv from '@techstark/opencv-js';

export function checkImageQuality(imageData: ImageData): QualityResult {
  const mat = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);

  // Blur detection via Laplacian variance
  const laplacian = new cv.Mat();
  cv.Laplacian(gray, laplacian, cv.CV_64F);
  const mean = new cv.Mat();
  const stddev = new cv.Mat();
  cv.meanStdDev(laplacian, mean, stddev);
  const variance = Math.pow(stddev.data64F[0], 2);

  // Brightness check
  const histogram = calculateHistogram(gray);
  const brightness = histogram.mean;

  // Cleanup
  mat.delete(); gray.delete(); laplacian.delete();

  return {
    isBlurry: variance < 100, // threshold for blur
    isDark: brightness < 50,
    isBright: brightness > 200,
    score: calculateOverallScore(variance, brightness),
    feedback: generateFeedback(variance, brightness)
  };
}
```

**Real-Time Feedback Loop**:
```typescript
// Runs at 15 FPS during video capture
useEffect(() => {
  const interval = setInterval(() => {
    const frame = captureVideoFrame(videoRef.current);
    const quality = checkImageQuality(frame);
    setQualityIndicator(quality.score > 80 ? 'green' :
                        quality.score > 50 ? 'yellow' : 'red');
    if (quality.feedback) {
      speakFeedback(quality.feedback); // TTS voice guidance
    }
  }, 66); // ~15 FPS

  return () => clearInterval(interval);
}, []);
```

---

### Component 5: ML Inference Service (Backend)

**Architecture**: Microservice (Python FastAPI)

**Location**: `kisanmind/services/ml-inference/`

**Structure**:
```
ml-inference/
├── app.py                    # FastAPI server
├── models/
│   ├── soil_classifier.py    # Soil analysis logic
│   ├── crop_disease.py       # Disease detection logic
│   └── field_analyzer.py     # Field condition analysis
├── weights/
│   ├── soil_model.onnx       # ONNX format for cross-platform
│   ├── disease_model.onnx
│   └── download_models.sh    # Script to fetch from Hugging Face
├── utils/
│   ├── image_preprocessing.py
│   ├── confidence_scoring.py
│   └── result_fusion.py      # Combine multiple image results
├── Dockerfile
├── requirements.txt
└── tests/
```

**API Design**:
```python
# app.py
from fastapi import FastAPI, File, UploadFile
from typing import List
import numpy as np
from models.soil_classifier import SoilClassifier
from models.crop_disease import DiseaseDetector

app = FastAPI()
soil_model = SoilClassifier()
disease_model = DiseaseDetector()

@app.post("/analyze-soil")
async def analyze_soil(
    images: List[UploadFile] = File(...),
    latitude: float,
    longitude: float
):
    # Preprocess images
    processed = [preprocess_image(await img.read()) for img in images]

    # Run inference on all images
    predictions = [soil_model.predict(img) for img in processed]

    # Ensemble: average confidence across images
    final_result = ensemble_predictions(predictions)

    # Compare with satellite data (call mcp-soil-intel)
    satellite_soil = await get_satellite_soil_data(latitude, longitude)

    # Fusion: weight visual (70%) + satellite (30%)
    fused_result = fuse_visual_and_satellite(final_result, satellite_soil)

    return {
        "visualAssessment": final_result,
        "satelliteAssessment": satellite_soil,
        "fusedResult": fused_result,
        "confidence": fused_result.confidence,
        "agreement": calculate_agreement(final_result, satellite_soil)
    }

@app.post("/analyze-crop")
async def analyze_crop(
    images: List[UploadFile] = File(...),
    crop_type: str,
    growth_stage: str
):
    processed = [preprocess_image(await img.read()) for img in images]

    # Run disease detection
    detections = []
    for img in processed:
        result = disease_model.detect(img, crop_type)
        if result.confidence > 0.7:  # Filter low-confidence detections
            detections.append(result)

    # Aggregate across images
    aggregated = aggregate_detections(detections)

    # Generate treatment recommendations
    recommendations = generate_treatment_plan(aggregated, growth_stage)

    return {
        "detections": aggregated,
        "recommendations": recommendations,
        "overallHealth": calculate_health_score(aggregated),
        "urgency": determine_urgency(aggregated)
    }
```

**Deployment**:
- **Container**: Docker image with Python 3.11 + ONNX Runtime
- **Hosting**: Same infrastructure as orchestrator (AWS/GCP/Azure)
- **Scaling**: Auto-scale based on request queue (target: < 5s response time)

---

### Component 6: Video Guidance Frontend

**Location**: `kisanmind/frontend/components/VideoGuidance/`

**Structure**:
```
VideoGuidance/
├── VideoGuidanceSession.tsx   # Main component
├── CameraCapture.tsx          # WebRTC camera access
├── QualityOverlay.tsx         # Visual feedback UI
├── VoiceInstructions.tsx      # TTS playback
├── ProgressTracker.tsx        # Shows 1/7, 2/7, etc.
├── hooks/
│   ├── useImageQuality.ts     # Quality checking logic
│   ├── useVoiceGuidance.ts    # TTS integration
│   └── useVideoStream.ts      # Camera stream management
└── types.ts
```

**Key Component** (`VideoGuidanceSession.tsx`):
```typescript
export function VideoGuidanceSession({
  language,
  onComplete
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const { stream, startCamera, captureImage } = useVideoStream();
  const { quality, checkQuality } = useImageQuality(stream);
  const { speak, isPlaying } = useVoiceGuidance(language);

  useEffect(() => {
    const instruction = CAPTURE_STEPS[currentStep];
    speak(instruction.text[language]);
  }, [currentStep, language]);

  const handleCapture = async () => {
    if (quality.score < 60) {
      speak(getFeedback(quality, language));
      return; // Don't capture low-quality image
    }

    const image = await captureImage();
    setCapturedImages([...capturedImages, {
      step: currentStep,
      data: image,
      quality: quality.score,
      timestamp: Date.now()
    }]);

    if (currentStep < CAPTURE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All images captured, send for analysis
      await submitForAnalysis(capturedImages);
      onComplete();
    }
  };

  return (
    <div className="video-session">
      <CameraCapture stream={stream} />
      <QualityOverlay quality={quality} />
      <ProgressTracker
        current={currentStep + 1}
        total={CAPTURE_STEPS.length}
      />
      <button
        onClick={handleCapture}
        disabled={quality.score < 60}
        className={quality.score >= 80 ? 'ready' : 'not-ready'}
      >
        {quality.score >= 80 ? 'Capture ✓' : 'Improve Quality'}
      </button>
      <button onClick={() => setCurrentStep(currentStep + 1)}>
        Skip This Step
      </button>
    </div>
  );
}
```

**Capture Steps Configuration**:
```typescript
// config/captureSteps.ts
export const CAPTURE_STEPS = [
  {
    id: "soil_sample_1",
    text: {
      en: "Show me your soil up close",
      hi: "मिट्टी को करीब से दिखाएं",
      mr: "तुमची माती जवळून दाखवा",
      ta: "உங்கள் மண்ணை நெருக்கமாக காட்டுங்கள்",
      te: "మీ మట్టిని దగ్గరగా చూపించండి"
    },
    target: "soil",
    qualityChecks: {
      minDistance: 20, // cm
      maxDistance: 50,
      minBrightness: 60,
      maxBlur: 100
    },
    helpText: {
      en: "Dig a small sample and hold 1 foot from camera",
      hi: "थोड़ी मिट्टी खोदें और कैमरे से 1 फुट दूर रखें"
      // ... other languages
    }
  },
  {
    id: "soil_sample_2",
    text: {
      en: "Now show soil from a different part of your field",
      hi: "अब खेत के दूसरे हिस्से की मिट्टी दिखाएं"
      // ...
    },
    target: "soil",
    // ... same quality checks
  },
  {
    id: "crop_leaf_1",
    text: {
      en: "Show me a healthy-looking crop leaf",
      hi: "एक स्वस्थ पत्ती दिखाएं"
      // ...
    },
    target: "crop_healthy",
    qualityChecks: {
      requiresLeafDetection: true,
      minLeafArea: 0.3, // 30% of frame
      maxBlur: 80
    }
  },
  {
    id: "crop_leaf_2",
    text: {
      en: "Show me any leaves with spots or damage",
      hi: "किसी भी धब्बे या क्षतिग्रस्त पत्ती को दिखाएं"
      // ...
    },
    target: "crop_diseased",
    optional: true, // Can skip if no disease visible
    // ...
  },
  {
    id: "water_source",
    text: {
      en: "Show your water source - well, borewell, or pond",
      hi: "अपना पानी का स्रोत दिखाएं - कुआँ, बोरवेल या तालाब"
      // ...
    },
    target: "water",
    optional: true,
    // ...
  },
  {
    id: "field_overview",
    text: {
      en: "Show a wide view of your entire field",
      hi: "अपने पूरे खेत का चौड़ा दृश्य दिखाएं"
      // ...
    },
    target: "field",
    qualityChecks: {
      requiresWideAngle: true,
      minFieldCoverage: 0.6
    }
  },
  {
    id: "weeds_or_issues",
    text: {
      en: "Show any weeds or problems you see",
      hi: "कोई भी खरपतवार या समस्या दिखाएं"
      // ...
    },
    target: "issues",
    optional: true
  }
];
```

---

### Component 7: Integration with Orchestrator

**Modification**: Orchestrator now calls 6 parallel assessments (5 MCP + 1 Visual)

**Location**: `kisanmind/orchestrator/orchestrator.ts`

**Enhanced Flow**:
```typescript
export async function runOrchestrator(
  farmerProfile: FarmerProfile
): Promise<FarmingDecisionReport> {

  // Check if farmer completed video assessment
  const hasVisualData = await checkVisualAssessmentAvailable(farmerProfile.farmerId);

  // Parallel intelligence gathering
  const assessments = await Promise.allSettled([
    // Original satellite-based MCP servers
    analyzeSoil(farmerProfile.location),
    analyzeWater(farmerProfile.location),
    analyzeClimate(farmerProfile.location),
    analyzeMarket(farmerProfile.location),
    findSchemes(farmerProfile.location, farmerProfile.landSize),

    // NEW: Visual assessment (if available)
    hasVisualData
      ? getVisualAssessment(farmerProfile.farmerId)
      : Promise.resolve(null)
  ]);

  const [soil, water, climate, market, schemes, visual] = assessments.map(
    r => r.status === 'fulfilled' ? r.value : null
  );

  // Enhanced synthesis with visual data
  const synthesisInput = {
    farmer: farmerProfile,
    satellite: { soil, water, climate },
    market: { market, schemes },
    visual: visual, // NEW
    dataQuality: calculateDataQuality(assessments) // NEW
  };

  return await synthesizeReport(synthesisInput);
}

async function getVisualAssessment(farmerId: string): Promise<VisualIntelligence> {
  const response = await fetch(`/api/visual-assessment/${farmerId}/latest`);
  const data = await response.json();

  return {
    soilAssessment: data.soil,
    cropHealthAssessment: data.crop,
    fieldConditionsAssessment: data.field,
    confidence: data.overallConfidence,
    capturedAt: data.timestamp,
    imageCount: data.images.length,
    agreementWithSatellite: data.satelliteComparison
  };
}
```

**Synthesis Agent Enhancement**:

The synthesis agent now receives both satellite and visual data:

```typescript
// synthesis-agent.ts (prompt modification)
const synthesisPrompt = `
You are synthesizing farming recommendations based on multiple data sources:

**Satellite-Based Assessments** (70-80% confidence):
${JSON.stringify(satellite, null, 2)}

**Visual Assessment from Farmer's Images** (85-90% confidence):
${JSON.stringify(visual, null, 2)}

**Agreement Analysis**:
- Soil Type: ${visual.soilAssessment.agreement} with satellite
- Crop Health: ${visual.cropHealthAssessment.detectedIssues.length} issues found
- Field Conditions: ${visual.fieldConditionsAssessment.notes}

**Data Quality**:
- Satellite: ${dataQuality.satellite} (always available)
- Visual: ${dataQuality.visual} (${visual ? 'AVAILABLE' : 'NOT AVAILABLE'})

**Synthesis Instructions**:
1. If visual data AGREES with satellite: Use visual assessment (higher confidence)
2. If visual data CONFLICTS: Investigate why, favor visual for surface properties
3. If visual data UNAVAILABLE: Use satellite only, note lower confidence
4. For crop diseases: ONLY visual data can detect (not visible in satellite)
5. For profit estimates: Use higher-confidence data source

Generate a farmer-facing report that explains:
- What we found (prioritize visual findings if available)
- Confidence level in recommendations
- Whether visual assessment confirms satellite data
- Specific crop diseases detected (if any)
- Recommended actions with profit impact
`;
```

---

## Phase-by-Phase Implementation

### Phase 1: MVP - Server-Side Image Analysis (Weeks 1-2)

**Goal**: Prove ML models work with real farmer images

**Deliverables**:
1. ML inference service (Python FastAPI)
   - Soil classification endpoint
   - Disease detection endpoint
   - Deploy on cloud (AWS EC2 t3.medium)

2. Simple image upload UI (no real-time guidance yet)
   - Farmer manually uploads 2 soil + 3 crop photos
   - Display progress spinner during analysis
   - Show results: soil type, diseases detected

3. Integration with orchestrator
   - Store visual assessment results in database
   - Orchestrator fetches and includes in synthesis

**Success Criteria**:
- Soil classification: 80%+ accuracy vs. SoilGrids
- Disease detection: Successfully identifies 3+ common diseases
- End-to-end latency: < 10 seconds from upload to result

**Testing**:
- Collect 50 test images from Indian farms (cotton, wheat, soybean)
- Manual validation by agricultural expert
- Compare results to satellite data

**File Changes**:
```
CREATE: kisanmind/services/ml-inference/
CREATE: kisanmind/frontend/pages/visual-assessment.tsx
MODIFY: kisanmind/orchestrator/orchestrator.ts (add visual assessment call)
MODIFY: kisanmind/orchestrator/synthesis-agent.ts (handle visual data)
CREATE: kisanmind/database/models/VisualAssessment.ts
```

---

### Phase 2: Real-Time Video Guidance (Weeks 3-4)

**Goal**: Add voice-guided capture system for better image quality

**Deliverables**:
1. Video guidance session UI
   - WebRTC camera access
   - Real-time blur detection (client-side)
   - Visual feedback overlay (green/yellow/red border)
   - Progress tracker (1/7, 2/7, etc.)

2. Voice guidance system
   - AI4Bharat Indic-TTS integration (Hindi first)
   - Pre-generate TTS audio for all instructions
   - Stream audio to frontend
   - Support for 4 languages (Hi, Mr, Ta, Te)

3. Image quality gating
   - Reject blurry images (< threshold)
   - Reject dark images (< 50 brightness)
   - Provide specific feedback: "Move closer", "Hold steady"

**Success Criteria**:
- 90%+ of captured images pass quality checks
- < 5 minute average session duration
- Farmer satisfaction: Can complete without confusion

**Testing**:
- User testing with 10 farmers (5 Hindi, 5 Marathi speakers)
- Measure: completion rate, time, quality of images captured
- Iterate on voice instructions based on feedback

**File Changes**:
```
CREATE: kisanmind/frontend/components/VideoGuidance/
CREATE: kisanmind/services/tts-service/ (TTS audio generation)
MODIFY: kisanmind/frontend/pages/visual-assessment.tsx (use VideoGuidance)
CREATE: kisanmind/frontend/utils/imageQualityCheck.ts
```

---

### Phase 3: Mobile Optimization & Offline Support (Weeks 5-6)

**Goal**: Make system work on low-end phones with poor connectivity

**Deliverables**:
1. Model quantization
   - Convert EfficientNetV2 to ONNX INT8 format
   - Reduce model size: 25MB → 6MB
   - Test accuracy retention (target: < 2% drop)

2. Progressive Web App (PWA)
   - Service worker for offline image capture
   - Queue images for upload when internet available
   - Background sync API

3. Bandwidth optimization
   - Image compression (JPEG quality 80)
   - Resize images to 800x600 before upload
   - Resume failed uploads

4. ONNX Runtime Mobile (optional)
   - Deploy soil classification model on-device
   - Instant results for basic soil type
   - Upload to server for detailed analysis

**Success Criteria**:
- Works on Android 8.0+ devices with 2GB RAM
- < 5MB data usage per assessment (7 images)
- Offline capture works, syncs when online

**Testing**:
- Test on budget smartphones (< $100)
- Simulate 2G/3G network conditions
- Battery usage measurement (target: < 5% per session)

**File Changes**:
```
CREATE: kisanmind/frontend/service-worker.ts (PWA)
CREATE: kisanmind/ml-inference/convert_to_onnx.py
CREATE: kisanmind/frontend/utils/imageCompression.ts
MODIFY: kisanmind/frontend/package.json (add PWA dependencies)
```

---

### Phase 4: Dataset Collection & Fine-Tuning (Weeks 7-8)

**Goal**: Improve accuracy with India-specific training data

**Deliverables**:
1. Data collection pipeline
   - Store all uploaded images + labels
   - Agricultural expert review portal
   - Crowdsourced validation (farmers vote on accuracy)

2. Fine-tuning cotton disease model
   - Collect 500+ cotton disease images (Vidarbha focus)
   - Label with expert validation
   - Fine-tune RDRM-YOLO on Indian cotton dataset
   - Compare accuracy: Base model vs. fine-tuned

3. Feedback loop
   - When synthesis agent's recommendation fails (farmer reports), log it
   - Use failures to identify weak spots in models
   - Prioritize data collection for problematic cases

**Success Criteria**:
- Cotton disease detection: 90%+ accuracy (up from 85% baseline)
- Collect 1,000+ labeled images across 5 crop types
- Model improvement measurable in A/B test

**Testing**:
- Deploy fine-tuned model to 50% of users (A/B test)
- Measure: farmer satisfaction, accuracy vs. expert labels
- Collect feedback: "Was this recommendation helpful?"

**File Changes**:
```
CREATE: kisanmind/data-pipeline/
CREATE: kisanmind/frontend/admin/expert-validation.tsx
CREATE: kisanmind/ml-training/ (training scripts)
MODIFY: kisanmind/services/ml-inference/ (load fine-tuned models)
```

---

## Technology Stack Decisions

### Frontend
```yaml
Framework: Next.js 14 (App Router)
UI: Tailwind CSS + shadcn/ui components
Camera: WebRTC via Simple-Peer
Image Processing: opencv.js (WebAssembly)
State Management: Zustand
PWA: next-pwa plugin
```

### Backend Services
```yaml
ML Inference:
  Framework: FastAPI (Python 3.11)
  ML Runtime: ONNX Runtime (CPU inference)
  Container: Docker + Kubernetes

TTS Service:
  Framework: FastAPI
  TTS Engine: AI4Bharat Indic-TTS
  Audio Format: MP3 (compressed)

Orchestrator:
  Language: TypeScript
  Runtime: Node.js 20
  (No changes, integrates via REST API)
```

### ML Models
```yaml
Soil Classification:
  Phase 1: OMIII1997 model (TensorFlow SavedModel)
  Phase 2: Convert to ONNX
  Size: ~50MB (Phase 1), ~12MB (Phase 2 quantized)

Disease Detection:
  Phase 1: EfficientNetV2-B0 (PlantVillage)
  Phase 2: RDRM-YOLO or YOLOv11
  Size: ~25MB (Phase 1), ~8MB (Phase 2)

Image Quality:
  Method: Laplacian variance + FFT (OpenCV)
  Runtime: Client-side JavaScript
  No model needed
```

### Infrastructure
```yaml
Hosting: AWS / GCP / Azure (hackathon: AWS)
ML Inference: EC2 t3.medium (2 vCPU, 4GB RAM)
Database: PostgreSQL (store visual assessments)
Object Storage: S3 (store uploaded images)
CDN: CloudFront (serve TTS audio files)
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ Farmer's Smartphone (Frontend)                               │
├──────────────────────────────────────────────────────────────┤
│ 1. Open "Improve Accuracy" feature in KisanMind app         │
│ 2. Select language (Hindi/Marathi/Tamil/Telugu)             │
│ 3. Start video guidance session                             │
│    → Camera permission granted                               │
│    → TTS plays: "मिट्टी को करीब से दिखाएं"                   │
│ 4. Real-time quality check (client-side)                    │
│    → Laplacian variance < 100 → Red border                   │
│    → TTS plays: "फोन को स्थिर रखें"                          │
│ 5. Quality OK → Capture button enabled → Tap                │
│ 6. Image compressed (800x600, JPEG 80) → Upload             │
│    → Repeat for 7 steps                                      │
│ 7. Session complete → Show "Analyzing..." spinner           │
└──────────────────────────────────────────────────────────────┘
    ↓ HTTPS POST (images + metadata)
┌──────────────────────────────────────────────────────────────┐
│ ML Inference Service (Backend - Python FastAPI)             │
├──────────────────────────────────────────────────────────────┤
│ 8. Receive 7 images + location + farmer ID                  │
│ 9. Validate images (size, format, not corrupted)            │
│ 10. Preprocess images                                        │
│     → Resize to model input size (224x224)                   │
│     → Normalize pixel values                                 │
│ 11. Run soil classification on 2 soil images                │
│     → Model inference: 200ms per image                       │
│     → Ensemble predictions (average confidence)              │
│ 12. Run disease detection on 3 crop images                  │
│     → Model inference: 150ms per image                       │
│     → Filter detections (confidence > 0.7)                   │
│ 13. Fetch satellite data for comparison                     │
│     → Call mcp-soil-intel API (lat, lng)                     │
│     → Compare visual vs. satellite                           │
│ 14. Generate structured result JSON                         │
│ 15. Store in database (PostgreSQL)                          │
│     → Table: visual_assessments                              │
│     → Link to farmer profile                                 │
│ 16. Return result to frontend                               │
└──────────────────────────────────────────────────────────────┘
    ↓ JSON response (2-5 seconds)
┌──────────────────────────────────────────────────────────────┐
│ Frontend - Display Results                                   │
├──────────────────────────────────────────────────────────────┤
│ 17. Show visual assessment summary                          │
│     → Soil: Black Cotton Soil (92% confidence)              │
│     → Disease: Bacterial Blight detected (88% confidence)    │
│     → Agreement: HIGH (matches satellite data)               │
│ 18. User clicks "Get Full Report"                           │
└──────────────────────────────────────────────────────────────┘
    ↓ Trigger orchestrator
┌──────────────────────────────────────────────────────────────┐
│ Orchestrator (Enhanced with Visual Data)                    │
├──────────────────────────────────────────────────────────────┤
│ 19. Fetch visual assessment from database                   │
│ 20. Run 5 MCP servers in parallel (satellite data)          │
│ 21. Synthesis Agent receives:                               │
│     → Satellite: 5 MCP outputs (70-80% confidence)           │
│     → Visual: Soil + disease data (85-90% confidence)        │
│ 22. Synthesis with extended thinking:                       │
│     → "Visual confirms black soil → High confidence"         │
│     → "Disease detected visually → Urgent treatment needed"  │
│     → "Profit estimate: Cotton risky due to disease"         │
│     → "Recommend: Treat disease OR switch to wheat"          │
│ 23. Generate final report (plain language)                  │
│ 24. Translate to farmer's language                          │
│ 25. TTS: Read report aloud                                  │
└──────────────────────────────────────────────────────────────┘
    ↓ Complete report delivered
┌──────────────────────────────────────────────────────────────┐
│ Farmer Receives Actionable Advice                           │
├──────────────────────────────────────────────────────────────┤
│ "तुमच्या काळी मातीत कापूस चांगला वाढेल, पण तुमच्या         │
│  पानांवर जीवाणू रोग आहे. आत्ता उपचार न केल्यास 10%        │
│  उत्पादन कमी होईल. स्ट्रेप्टोसायक्लिन फवारणी करा (₹400). │
│  किंवा गव्हात बदला - गव्हात ₹45,000 नफा होईल."           │
│                                                              │
│ [Apply for PMFBY Insurance] [Buy Pesticide] [View Full Map] │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

```sql
-- New table for visual assessments
CREATE TABLE visual_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  session_id UUID NOT NULL,
  captured_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Soil analysis results
  soil_type VARCHAR(50),
  soil_confidence FLOAT,
  soil_texture VARCHAR(50),
  soil_color VARCHAR(20),
  soil_recommendations JSONB,

  -- Crop health results
  crop_diseases JSONB, -- Array of detected diseases
  crop_health_score FLOAT,
  crop_recommendations JSONB,

  -- Field conditions
  field_notes TEXT,
  weed_severity VARCHAR(20),
  water_stress_visible BOOLEAN,

  -- Data quality
  image_count INTEGER,
  image_quality_avg FLOAT,
  overall_confidence FLOAT,

  -- Comparison with satellite
  satellite_agreement VARCHAR(20), -- 'HIGH', 'MEDIUM', 'LOW', 'CONFLICT'
  satellite_comparison JSONB,

  -- Raw data
  images JSONB, -- Array of S3 URLs
  metadata JSONB,

  -- Status
  status VARCHAR(20), -- 'processing', 'completed', 'failed'
  error_message TEXT,

  -- Indexes
  CONSTRAINT fk_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id),
  INDEX idx_farmer_date (farmer_id, captured_at DESC),
  INDEX idx_status (status)
);

-- New table for captured images
CREATE TABLE captured_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES visual_assessments(id),
  step_id VARCHAR(50) NOT NULL, -- 'soil_sample_1', 'crop_leaf_1', etc.
  s3_url VARCHAR(500) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,

  -- Image metadata
  captured_at TIMESTAMP NOT NULL,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  format VARCHAR(10), -- 'jpeg', 'png'

  -- Quality metrics
  quality_score FLOAT,
  is_blurry BOOLEAN,
  brightness FLOAT,

  -- GPS if available
  latitude FLOAT,
  longitude FLOAT,

  CONSTRAINT fk_assessment FOREIGN KEY (assessment_id) REFERENCES visual_assessments(id) ON DELETE CASCADE
);

-- Add column to farmers table
ALTER TABLE farmers ADD COLUMN has_visual_assessment BOOLEAN DEFAULT FALSE;
ALTER TABLE farmers ADD COLUMN last_visual_assessment_at TIMESTAMP;
```

---

## Testing Strategy

### Unit Tests
```yaml
Backend (Python):
  - test_soil_classifier.py: Test model inference
  - test_disease_detector.py: Test disease detection
  - test_image_preprocessing.py: Test preprocessing pipeline
  - test_confidence_scoring.py: Test ensemble logic

Frontend (TypeScript):
  - imageQualityCheck.test.ts: Test blur detection
  - captureSteps.test.ts: Test step configuration
  - videoStream.test.ts: Test camera access
```

### Integration Tests
```yaml
E2E Testing:
  - Capture session flow (Playwright)
  - Upload images → Get results
  - Orchestrator integration test
  - Database storage verification

API Testing:
  - /api/ml/analyze-soil endpoint
  - /api/ml/analyze-crop endpoint
  - /api/guidance/start endpoint
```

### Performance Tests
```yaml
Load Testing:
  - Simulate 100 concurrent image uploads
  - Measure: response time, throughput, error rate
  - Target: < 10s p95 latency, < 1% error rate

Model Benchmark:
  - Inference speed on different hardware
  - Accuracy vs. expert labels
  - Quantized model accuracy retention
```

### User Acceptance Testing
```yaml
Field Testing:
  - 20 farmers (10 Hindi, 5 Marathi, 5 Tamil)
  - Scenarios: Morning light, evening light, cloudy
  - Devices: 5 budget phones, 3 mid-range, 2 high-end
  - Metrics: Completion rate, time, satisfaction, accuracy

Expert Validation:
  - Agricultural expert reviews 100 assessments
  - Compare: ML results vs. expert opinion
  - Calculate: precision, recall, F1 score
```

---

## Risk Mitigation

### Risk 1: Low Model Accuracy in Field Conditions
**Mitigation**:
- Display confidence scores prominently
- Require > 80% confidence for actionable recommendations
- Offer "Get Expert Review" option for low-confidence results
- Collect misclassified images for retraining

### Risk 2: Poor Internet Connectivity
**Mitigation**:
- Offline image capture with background sync
- Compress images aggressively (< 200KB each)
- Resume failed uploads automatically
- Show clear status: "Uploading 3/7 images"

### Risk 3: Language/Accent Issues in Voice Guidance
**Mitigation**:
- Pre-recorded TTS audio (not real-time generation)
- Provide text transcripts alongside audio
- Add visual hints (icons, animations)
- Allow manual step progression (skip audio)

### Risk 4: Farmer Privacy Concerns
**Mitigation**:
- Clear consent: "Images used only for your assessment"
- Option to delete images after analysis
- Anonymize images for training dataset
- Comply with data protection laws (India IT Act)

### Risk 5: Model Deployment Failures
**Mitigation**:
- Fallback to satellite data if ML service down
- Health checks + auto-restart for inference service
- Graceful degradation: "Visual assessment unavailable, using satellite data"
- Monitor error rates, alert on > 5% failures

---

## Success Metrics

### Technical Metrics
```yaml
Accuracy:
  - Soil classification: > 85% vs. expert labels
  - Disease detection: > 85% vs. expert labels
  - Satellite agreement: > 70% HIGH agreement

Performance:
  - Image upload: < 3s per image (800x600 JPEG)
  - ML inference: < 5s total (all 7 images)
  - E2E latency: < 10s (capture to result display)

Reliability:
  - Service uptime: > 99%
  - Error rate: < 2%
  - Successful captures: > 95% of sessions
```

### User Experience Metrics
```yaml
Adoption:
  - % farmers who try visual assessment: Target 50%
  - % who complete session: Target 80%
  - % who re-use feature: Target 60%

Satisfaction:
  - "Was this helpful?": Target 4.5/5 stars
  - "Would you recommend?": Target 80% yes
  - Time to complete: Target < 5 minutes

Impact:
  - Confidence boost: Farmers report higher trust
  - Action rate: % who follow recommendations: Target 70%
```

### Business Metrics
```yaml
Cost:
  - Per assessment: Target < ₹5 (cloud compute)
  - Data storage: Target < ₹1/farmer/year
  - TTS audio: One-time cost (pre-generate)

ROI:
  - Increased farmer retention: Target +20%
  - Premium feature: Potential monetization ($0.50/assessment)
  - Data value: Labeled dataset worth for research
```

---

## Open Questions & Decisions Needed

### Question 1: Monetization Strategy
**Options**:
- A) Free for all (build user base)
- B) Freemium (1 free assessment, ₹50 for additional)
- C) Premium feature (part of paid subscription)
- D) B2B (sell to agri-input companies, insurance)

**Recommendation**: Option A for hackathon, evaluate B after 1000 users

### Question 2: Expert-in-the-Loop
**Options**:
- A) Fully automated (no human review)
- B) Expert review for low-confidence cases (< 70%)
- C) Expert review on farmer request
- D) Community validation (farmers vote on accuracy)

**Recommendation**: Option B for critical decisions (disease treatment)

### Question 3: Data Ownership & Training
**Options**:
- A) Use all farmer images for model training (with consent)
- B) Anonymize and use only for aggregate research
- C) Opt-in only (farmers explicitly allow training use)
- D) Never use for training (privacy-first)

**Recommendation**: Option C with clear consent form

### Question 4: Integration Timing
**Options**:
- A) Optional add-on (after satellite report)
- B) Mandatory step (required for all assessments)
- C) Prompted for uncertain cases ("Improve accuracy?")
- D) Separate "Visual Checkup" feature

**Recommendation**: Option A initially, then C based on data

---

## Implementation Timeline (6-8 Weeks)

```
Week 1-2: Phase 1 - MVP (Server-side inference)
├─ Set up ML inference service
├─ Deploy soil + disease models
├─ Build simple upload UI
└─ Integration test

Week 3-4: Phase 2 - Real-time guidance
├─ Video capture UI (WebRTC)
├─ TTS integration (AI4Bharat)
├─ Quality checks (Laplacian variance)
└─ User testing (10 farmers)

Week 5-6: Phase 3 - Mobile optimization
├─ Model quantization (ONNX)
├─ PWA offline support
├─ Bandwidth optimization
└─ Low-end device testing

Week 7-8: Phase 4 - Fine-tuning (if time permits)
├─ Collect 500+ labeled images
├─ Fine-tune cotton disease model
├─ A/B test vs. baseline
└─ Deploy improved models

Post-Hackathon: Continuous improvement
├─ Expand to more crops
├─ Add weed detection
├─ Integrate with IoT sensors
└─ Build farmer community features
```

---

## Cost Estimation (Monthly)

```yaml
Infrastructure:
  ML Inference (EC2 t3.medium): $30/month
  Database (RDS PostgreSQL): $20/month
  Object Storage (S3): $5/month (1000 farmers × 7 images)
  CDN (CloudFront): $10/month (TTS audio)

Total Monthly Cost: ~$65/month
Cost per Assessment: ~$0.02 (assuming 3000 assessments/month)
```

---

## Conclusion

This implementation plan adds **visual intelligence** to KisanMind, bridging the accuracy gap between satellite data and physical inspection. By guiding farmers through AI-powered video capture sessions, we achieve:

✅ **85-90% accuracy** (vs. 70-80% satellite-only)
✅ **Zero cost to farmer** (no lab fees)
✅ **Disease detection capability** (not possible with satellite)
✅ **Higher farmer trust** (visual confirmation of satellite data)
✅ **Actionable insights** (specific diseases → specific treatments)

The phased approach ensures we can demonstrate core functionality during the hackathon (Phase 1-2) while leaving room for optimization and fine-tuning post-event.

**Next Step**: Begin Phase 1 implementation - set up ML inference service and deploy initial models.
