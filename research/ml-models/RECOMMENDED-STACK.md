# Recommended ML Stack for KisanMind Video Land Assessment
## Executive Summary & Implementation Guide

**Last Updated**: February 12, 2026
**Status**: Production-Ready Recommendations

---

## 🎯 TL;DR - Just Tell Me What to Use

### For Backend Server (MVP)
```
Video: Jitsi Meet (self-hosted, Apache 2.0)
Inference: ONNX Runtime (CPU-optimized, MIT)
Soil: MobileNetV2 (custom-trained on Indian soils, 15 MB)
Cotton: RF-Cott-Net (98.4% accuracy, 4.8 MB) ⭐
Rice: YOLOv5s-Ghost (93% F1, 14 MB)
General Crops: YOLOv8n (92%+, 6.2 MB) ⚠️ AGPL license
Voice: Bhashini API (Hindi, Marathi, 22+ languages)
Quality Check: OpenCV Laplacian Variance (real-time)
```

### For Mobile App (Offline Mode)
```
Inference: TensorFlow Lite (hardware accelerated)
Models: YOLOv8n-INT8 (1.5 MB), MobileNetV2 (15 MB)
TTS: AI4Bharat Indic-TTS (100-500 MB)
STT: AI4Bharat IndicWav2Vec (300-500 MB)
```

### Budget
- **MVP (Online Mode)**: $400-800/month (backend server + Bhashini API)
- **Enhanced (Offline)**: +$0 (one-time model downloads)

---

## 🚀 Quick Start Implementation (Week 1)

### Step 1: Set Up Video Infrastructure
```bash
# Install Jitsi Meet on Ubuntu server
wget https://download.jitsi.org/jitsi-key.gpg.key
sudo apt-key add jitsi-key.gpg.key
sudo sh -c "echo 'deb https://download.jitsi.org stable/' > /etc/apt/sources.list.d/jitsi-stable.list"
sudo apt update
sudo apt install jitsi-meet
```

**Configure for low bandwidth**:
- Enable VP8 codec (better compression)
- Set initial bitrate to 128 kbps
- Enable simulcast for adaptive streaming

### Step 2: Register for Bhashini API
- Visit: https://bhashini.gov.in/ulca
- Register account
- Get API key
- Documentation: https://bhashini.gitbook.io/bhashini-apis

### Step 3: Download Pre-Trained Models

**For Cotton Pest Detection (Vidarbha priority)**:
```python
# RF-Cott-Net: Contact authors from MDPI Plants journal paper
# Paper: "Resource-Efficient Cotton Network" (2025)
# Alternative: Use YOLOv8n as placeholder
from ultralytics import YOLO
model = YOLO('yolov8n.pt')  # Temporary until RF-Cott-Net is integrated
```

**For General Crop Disease**:
```python
# Download YOLOv8n pre-trained on COCO, fine-tune on PlantVillage
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
# Fine-tune on PlantVillage dataset (download from Kaggle)
model.train(data='plantvillage.yaml', epochs=50)
```

**For Image Quality**:
```python
import cv2
import numpy as np

def check_blur(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    return laplacian_var > 100  # True = sharp, False = blurry
```

### Step 4: Build ML Inference Pipeline
```python
import onnxruntime as ort

# Load models
soil_model = ort.InferenceSession("soil_classifier.onnx")
crop_model = ort.InferenceSession("yolov8n.onnx")
cotton_model = ort.InferenceSession("rf_cott_net.onnx")

def process_video_frame(frame):
    # 1. Quality check
    if not check_blur(frame):
        return {"status": "blurry", "message": "Hold camera steady"}

    # 2. Run inference
    soil_result = soil_model.run(None, {"input": preprocess(frame)})
    crop_result = crop_model.run(None, {"input": preprocess(frame)})

    # 3. Return results
    return {
        "status": "success",
        "soil_type": soil_result,
        "crop_health": crop_result
    }
```

### Step 5: Integrate Bhashini TTS/STT
```python
import requests

BHASHINI_API_KEY = "your_api_key"
BHASHINI_ENDPOINT = "https://bhashini.gov.in/api/v1"

def text_to_speech(text, language="hi"):  # hi = Hindi
    payload = {
        "text": text,
        "language": language,
        "service": "tts"
    }
    response = requests.post(
        f"{BHASHINI_ENDPOINT}/tts",
        json=payload,
        headers={"Authorization": f"Bearer {BHASHINI_API_KEY}"}
    )
    return response.content  # Audio file

def speech_to_text(audio_file, language="hi"):
    files = {"audio": audio_file}
    data = {"language": language, "service": "stt"}
    response = requests.post(
        f"{BHASHINI_ENDPOINT}/stt",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {BHASHINI_API_KEY}"}
    )
    return response.json()["text"]
```

---

## 📊 Model Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Soil Classification Accuracy** | 90%+ | Good enough for crop recommendations |
| **Cotton Pest Detection** | 95%+ | Critical for Vidarbha (RF-Cott-Net achieves 98.4%) |
| **General Crop Disease** | 90%+ | YOLOv8n achieves 92%+ on PlantVillage |
| **Inference Latency** | <300ms | Real-time video feedback |
| **Video Call Latency** | <2s | Acceptable for farmer interaction |
| **TTS Response Time** | <500ms | Natural conversation flow |

---

## 🔧 Critical Configuration Settings

### Jitsi Meet for Rural Networks
```javascript
// config.js settings for low-bandwidth optimization
var config = {
    // Start at lowest quality
    resolution: 360,
    constraints: {
        video: {
            height: {
                ideal: 360,
                max: 480,
                min: 180
            },
            frameRate: {
                ideal: 15,
                max: 20
            }
        }
    },
    // Enable adaptive bitrate
    enableLayerSuspension: true,
    // VP8 codec (better compression)
    videoCodecPreferenceOrder: ['VP8', 'VP9', 'H264'],
    // Optimize for mobile
    disableAudioLevels: true,
    enableNoAudioDetection: true
};
```

### ONNX Runtime Optimization
```python
import onnxruntime as ort

# Configure for CPU inference
sess_options = ort.SessionOptions()
sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
sess_options.intra_op_num_threads = 4  # Adjust based on CPU cores

# Enable parallel execution
sess_options.execution_mode = ort.ExecutionMode.ORT_PARALLEL

# Load model
model = ort.InferenceSession("model.onnx", sess_options)
```

---

## 🛠️ Data Collection Requirements

### Priority 1: Indian Soil Dataset (MVP Blocker)
**Goal**: Train MobileNetV2 for 4-5 Indian soil types
- **Images Needed**: 1,000-2,000 (200-400 per soil type)
- **Soil Types**:
  - Black cotton soil (Vidarbha, Deccan)
  - Red soil (Karnataka, Tamil Nadu)
  - Alluvial soil (Indo-Gangetic plains)
  - Laterite soil (Western Ghats)
  - Sandy loam (Rajasthan)
- **Collection Method**:
  - Partner with agricultural universities (MPKV Rahuri, TNAU Coimbatore)
  - Field visits to Vidarbha (cotton farms)
  - Smartphone images (standardized lighting, distance)
- **Annotation**: Single-label classification (soil type)
- **Timeline**: 2-4 weeks

### Priority 2: NPK Deficiency Dataset (Phase 2)
**Goal**: Fine-tune YOLOv8s for nitrogen/phosphorus/potassium deficiency detection
- **Images Needed**: 500-1,000 per crop (cotton, rice, wheat)
- **Classes**: Nitrogen deficiency, Phosphorus deficiency, Potassium deficiency, Healthy
- **Collection Method**:
  - Controlled experiments (induce deficiencies in test plots)
  - Partner with ICAR research stations
  - Label with soil test reports (ground truth)
- **Annotation**: Bounding boxes (leaf-level detection)
- **Timeline**: 4-8 weeks

### Priority 3: Validation Dataset (Real Field Conditions)
**Goal**: Test models on real farmer fields
- **Images Needed**: 200-500 field images (diverse conditions)
- **Capture**: Occlusion, clutter, poor lighting, multiple diseases per plant
- **Use**: Benchmark model robustness vs. lab datasets (PlantVillage)
- **Timeline**: Ongoing (collect during field testing)

---

## 📱 Mobile App Architecture (Phase 2)

### React Native App Structure
```
KisanMindApp/
├── src/
│   ├── components/
│   │   ├── VideoCall.tsx          # Jitsi Meet integration
│   │   ├── VoiceGuidance.tsx      # TTS/STT controls
│   │   └── CameraView.tsx         # Image capture + quality check
│   ├── services/
│   │   ├── MLInference.ts         # TensorFlow Lite inference
│   │   ├── BhashiniAPI.ts         # TTS/STT API calls
│   │   └── VideoStream.ts         # WebRTC handling
│   ├── models/
│   │   ├── yolov8n_int8.tflite   # Crop disease detection (1.5 MB)
│   │   ├── soil_classifier.tflite # Soil type (15 MB)
│   │   └── npk_detector.tflite   # Nutrient deficiency (5 MB)
│   └── assets/
│       ├── tts_models/            # Indic-TTS offline models (100-500 MB)
│       └── stt_models/            # IndicWav2Vec offline (300-500 MB)
```

### TensorFlow Lite Integration
```javascript
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Load quantized model (INT8)
const model = await tf.loadLayersModel(
  bundleResourceIO(
    require('./models/yolov8n_int8.tflite')
  )
);

// Run inference
const preprocessed = preprocessImage(imageData);
const prediction = await model.predict(preprocessed);
```

---

## 🔐 Licensing Strategy

### Problem: YOLOv8/v11 is AGPL-3.0
**What this means**: If you use Ultralytics YOLO models, you MUST open-source your entire application code.

### Solutions (Choose One):

#### Option 1: Open Source KisanMind ✅ RECOMMENDED
- **Pros**: Aligns with hackathon spirit, community contributions, free YOLO usage
- **Cons**: Proprietary features difficult
- **License**: Use AGPL-3.0 or MIT for KisanMind codebase
- **Cost**: $0

#### Option 2: Buy Ultralytics Enterprise License
- **Pros**: Keep KisanMind closed-source, commercial flexibility
- **Cons**: Expensive ($$$$ annually)
- **Cost**: Contact Ultralytics for pricing (likely $5,000-$50,000/year)

#### Option 3: Use Apache 2.0 Alternatives
- **Models**: TensorFlow Object Detection API, Detectron2 (Facebook), MMDetection
- **Pros**: Fully open-source friendly, no restrictions
- **Cons**: Lower accuracy than YOLO, more complex training
- **Cost**: $0
- **Performance**: ~5-10% lower mAP than YOLO

#### Option 4: Use YOLOv5 (GPL-3.0, less restrictive)
- **Difference**: GPL allows closed-source if you don't distribute binaries (SaaS loophole)
- **Pros**: Slightly more permissive than AGPL
- **Cons**: Still restrictive, older architecture
- **Cost**: $0

**Recommendation for KisanMind**: **Open-source the platform** (Option 1). This aligns with the "Break the Barriers" theme and allows free YOLO usage.

---

## 🌐 Deployment Architecture

### Cloud Infrastructure (AWS Example)

```
┌─────────────────────────────────────────────────┐
│  Application Load Balancer (ALB)                │
│  - HTTPS termination                            │
│  - Route to Jitsi + API servers                 │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│ Jitsi Meet  │  │ ML API       │
│ EC2 (c5.2xl)│  │ EC2 (c5.4xl) │
│ - WebRTC    │  │ - ONNX RT    │
│ - Video     │  │ - Models     │
└─────────────┘  └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │ S3 Storage   │
                 │ - Videos     │
                 │ - Models     │
                 └──────────────┘
```

**Monthly Cost Estimate**:
- c5.2xlarge (Jitsi): $250/month
- c5.4xlarge (ML API): $500/month
- S3 storage (100 GB): $10/month
- Data transfer (500 GB): $45/month
- **Total**: ~$800/month (for 100 concurrent users)

### Alternative: Indian Cloud Providers
- **Yotta Data Services**: Same infrastructure, data sovereignty
- **Cost**: 10-20% cheaper than AWS
- **Advantage**: Bhashini already on Yotta (lower latency)

---

## 🧪 Testing Checklist

### Pre-Launch Testing (MVP)

- [ ] **Video Call Quality**
  - [ ] Test on 2G network (128 kbps) - video streams
  - [ ] Test on 3G network (256 kbps) - acceptable quality
  - [ ] Test on 4G network (512 kbps) - high quality
  - [ ] Audio clarity in Hindi/Marathi
  - [ ] Latency < 2 seconds

- [ ] **ML Model Accuracy**
  - [ ] Soil classifier: Test on 100 Indian soil images (target: 90%+)
  - [ ] Cotton pest: Test on Vidarbha field images (target: 95%+)
  - [ ] General crop disease: Test on PlantVillage (target: 90%+)
  - [ ] Image quality check: Reject blurry images (threshold: Laplacian < 100)

- [ ] **Voice Guidance**
  - [ ] Bhashini TTS: Hindi, Marathi (clarity, naturalness)
  - [ ] Bhashini STT: Farmer accent recognition (Maharashtra rural)
  - [ ] Fallback to Indic-TTS if Bhashini API down

- [ ] **End-to-End Flow**
  - [ ] Farmer initiates call → Video connects < 5s
  - [ ] Voice guidance: "Show me the soil" → Camera focuses
  - [ ] Image quality feedback: "Too blurry, hold steady"
  - [ ] ML inference: Soil type identified in < 3s
  - [ ] Voice result: "This is black cotton soil, good for cotton"
  - [ ] Repeat for crops, pests, leaves
  - [ ] Generate report in < 5 minutes

- [ ] **Error Handling**
  - [ ] Poor internet: Degrade to 360p, continue call
  - [ ] API timeout: Fallback to offline models (Phase 2)
  - [ ] Model confidence < 70%: "I'm not sure, consult expert"

---

## 📈 Success Metrics (Track Post-Launch)

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| **Assessment Completion Rate** | 80%+ | (Completed calls / Started calls) |
| **Model Accuracy (Farmer Feedback)** | 85%+ | Post-call survey: "Was the advice accurate?" |
| **Average Call Duration** | 5-10 min | Analytics dashboard |
| **Farmer Satisfaction** | 4.0/5.0 | Post-call rating |
| **Technical Success Rate** | 95%+ | (Successful inferences / Total attempts) |
| **Repeat Usage** | 40%+ | Farmers returning within 30 days |

---

## 🚨 Known Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Poor model accuracy on Indian soils** | High | Critical | Collect 1,000+ Indian soil images ASAP |
| **Bhashini API downtime** | Medium | High | Implement AI4Bharat offline fallback |
| **YOLO licensing issues** | High | Critical | Open-source KisanMind under AGPL-3.0 |
| **2G network failure** | Medium | High | Fallback to image upload (no video) |
| **Farmer distrust of AI** | Medium | Medium | Add confidence scores, "verify with expert" disclaimers |
| **High cloud costs** | Low | Medium | Optimize inference (CPU only, quantization) |

---

## 📚 Essential Resources

### Documentation
- **Jitsi Meet**: https://jitsi.github.io/handbook/docs/intro
- **ONNX Runtime**: https://onnxruntime.ai/docs/
- **TensorFlow Lite**: https://www.tensorflow.org/lite/guide
- **Bhashini API**: https://bhashini.gitbook.io/bhashini-apis
- **Ultralytics YOLOv8**: https://docs.ultralytics.com/

### Datasets
- **PlantVillage**: https://www.kaggle.com/datasets/emmarex/plantdisease
- **PlantDoc**: https://github.com/pratikkayal/PlantDoc-Dataset
- **CottonWeedDet12**: Search "CottonWeedDet12 dataset" on Google Scholar

### Pre-Trained Models
- **YOLOv8**: https://github.com/ultralytics/ultralytics
- **AI4Bharat Indic-TTS**: https://github.com/AI4Bharat/Indic-TTS
- **AI4Bharat IndicWav2Vec**: https://github.com/AI4Bharat/IndicWav2Vec
- **RF-Cott-Net**: Contact authors from MDPI Plants journal

### Community Support
- **Ultralytics Discord**: https://discord.com/invite/ultralytics
- **AI4Bharat**: Contact via GitHub issues
- **Jitsi Community**: https://community.jitsi.org/

---

## 🎯 90-Day Roadmap

### Month 1: MVP (Online Mode)
**Week 1-2**: Infrastructure
- Set up Jitsi Meet server
- Register Bhashini API
- Build React Native app shell

**Week 3-4**: Core ML
- Collect/train Indian soil classifier (1,000 images)
- Download YOLOv8n, fine-tune on PlantVillage
- Integrate ONNX Runtime inference pipeline

### Month 2: Enhanced Features
**Week 5-6**: Crop-Specific Models
- Integrate RF-Cott-Net for cotton (Vidarbha)
- Add YOLOv5s-Ghost for rice
- Fine-tune YOLOv8s on NPK dataset

**Week 7-8**: Field Testing
- Test with 50 farmers in Maharashtra
- Measure accuracy, latency, satisfaction
- Iterate based on feedback

### Month 3: Offline Mode & Scale
**Week 9-10**: Mobile Optimization
- Convert models to TensorFlow Lite (INT8)
- Integrate AI4Bharat Indic-TTS (offline)
- Add IndicWav2Vec (offline STT)

**Week 11-12**: Production Readiness
- Load testing (100 concurrent users)
- Security audit (HTTPS, API keys)
- Documentation (user guide, API docs)

---

## 🏆 Hackathon Deliverables Checklist

- [ ] **Working Demo**
  - [ ] Video call between farmer (mobile) and KisanMind (backend)
  - [ ] Real-time soil classification (Indian soils)
  - [ ] Cotton pest detection (RF-Cott-Net)
  - [ ] Voice guidance in Hindi/Marathi (Bhashini)
  - [ ] Generate farming recommendation report (Claude Opus 4.6)

- [ ] **Technical Documentation**
  - [ ] Architecture diagram
  - [ ] Model performance benchmarks
  - [ ] API documentation (if applicable)
  - [ ] Setup instructions (README.md)

- [ ] **Open Source Repository**
  - [ ] GitHub repo with code (AGPL-3.0 or MIT license)
  - [ ] Installation guide
  - [ ] Contribution guidelines
  - [ ] Issue templates

- [ ] **Video Demonstration (5 min)**
  - [ ] Problem statement (farmers need quick land assessment)
  - [ ] Solution walkthrough (video call → ML analysis → recommendations)
  - [ ] Technical highlights (Claude Opus 4.6, multi-agent, MCP servers)
  - [ ] Impact story (Vidarbha farmer example)

- [ ] **Submission Materials**
  - [ ] Project description (500 words)
  - [ ] Screenshots/photos
  - [ ] Team member bios
  - [ ] Links to code, demo, documentation

---

**Document Version**: 1.0
**Companion Documents**:
- Full research: `video-land-assessment-comprehensive-research.md`
- Model comparison: `model-comparison-matrix.md`

**Next Actions**:
1. Review this stack with development team
2. Set up Jitsi Meet server (Day 1)
3. Register Bhashini API (Day 1)
4. Start collecting Indian soil images (Week 1)
5. Download YOLOv8n and test inference (Week 1)
