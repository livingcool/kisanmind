# ML Model Comparison Matrix for KisanMind Video Assessment
## Quick Reference Guide

**Last Updated**: February 12, 2026

---

## 1. Soil Analysis Models

| Model | Accuracy | Model Size | Inference Time | Deployment | Indian Soils | Status | GitHub/Source |
|-------|----------|------------|----------------|------------|--------------|--------|---------------|
| **AgroSense** | 98.0% | 50-100 MB | 100-200ms | CPU/GPU | ⚠️ Global | Research | [arXiv 2509.01344](https://arxiv.org/abs/2509.01344) |
| **Light-SoilNet** | 97.2% | <20 MB | 50ms | CPU | ⚠️ Needs fine-tuning | Published | Research paper |
| **SoilNet** | TGRS 2025 | 200-300 MB | 300-500ms | GPU preferred | ✅ Satellite data | Production | [moienr/SoilNet](https://github.com/moienr/SoilNet) |
| **MobileNetV2 Soil** | 95%+ | 15 MB | 40ms | Mobile | ✅ Trainable | Custom | - |

**Recommendation**: Train custom **MobileNetV2** on Indian soil dataset (black cotton, laterite, alluvial, red)

---

## 2. Crop Disease & Pest Detection Models

### General Plant Disease

| Model | Dataset | Accuracy | Model Size | Inference | Platform | Indian Crops | GitHub |
|-------|---------|----------|------------|-----------|----------|--------------|--------|
| **YOLOv8n + PlantVillage** | 54K images, 38 classes | 92%+ | 6.2 MB | 30ms | Mobile/Edge | ✅ Universal | [ultralytics](https://github.com/ultralytics/ultralytics) |
| **EfficientNet + PlantVillage** | 54K images | 99.97% | 20 MB | 50ms | CPU/GPU | ✅ Universal | TensorFlow |
| **YOLOv5 + PlantDoc** | 2.5K images, 29 classes | 90%+ | 14 MB | 40ms | CPU | ✅ Field images | [leaf_disease_detection](https://github.com/kruthi-sb/leaf_disease_detection) |
| **SWIN Transformer** | PlantVillage | 88% (real-world) | 100 MB | 150ms | GPU | ✅ Robust | PyTorch |

### Cotton-Specific (CRITICAL FOR VIDARBHA)

| Model | Accuracy | Model Size | Inference | Platform | Status |
|-------|----------|------------|-----------|----------|--------|
| **RF-Cott-Net** | 98.4% | 4.8 MB | 3.8ms | Raspberry Pi / Jetson | ✅ Production-ready |

### Rice-Specific

| Model | Accuracy | Model Size | Inference | Platform | Status |
|-------|----------|------------|-----------|----------|--------|
| **YOLOv5s-Ghost** | 93.1% F1 | 14 MB | 25ms | Mobile | ✅ Production-ready |
| **YOLOv7-tiny** | 90%+ | 12 MB | 20ms | Mobile/Edge | ✅ Production-ready |

**Recommendation**:
- **Cotton (Vidarbha)**: **RF-Cott-Net** (India-specific, proven)
- **Rice**: **YOLOv5s-Ghost**
- **General**: **YOLOv8n** (smallest, fastest)

---

## 3. Nutrient Deficiency Detection (NPK)

| Model | Crop | Accuracy | Model Size | Inference | Status | Source |
|-------|------|----------|------------|-----------|--------|--------|
| **YOLOv8s NPK** | Soybean | 99.18% mAP | 21.5 MB | 40ms | Fine-tune needed | [Nature SR](https://www.nature.com/articles/s41598-024-83295-6) |
| **SRDL Model** | Rice | 95.01% | 15 MB | 35ms | Fine-tune needed | [Nature SR](https://www.nature.com/articles/s41598-025-97585-0) |
| **VGG16** | Coffee | 99.67% | 50 MB | 80ms | Transfer learning | Research |
| **YOLO11s** | Coffee | 90%+ mAP | 20 MB | 35ms | Fine-tune needed | Research |

**Recommendation**: Fine-tune **YOLOv8s** on NPK dataset for target crops (cotton, rice, wheat)

---

## 4. Weed Detection Models

| Model | Dataset | Accuracy | Model Size | Inference | Status | Source |
|-------|---------|----------|------------|-----------|--------|--------|
| **PD-YOLO** | CottonWeedDet12 (5.6K images) | 95%+ mAP | 20 MB | 35ms | Production-ready | [Frontiers](https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2025.1506524/full) |
| **YOLOv11s** | Open source datasets | 93%+ | 20 MB | 30ms | Production-ready | Ultralytics |
| **GTDR-YOLOv12** | Agricultural datasets | 96%+ | 18 MB | 32ms | Production-ready | [MDPI Agronomy](https://www.mdpi.com/2073-4395/15/8/1824) |

**Recommendation**: **PD-YOLO** for cotton weed detection

---

## 5. Video Communication Technologies

| Solution | Latency | Protocols | Low Bandwidth | Licensing | Deployment | Recommendation |
|----------|---------|-----------|---------------|-----------|------------|----------------|
| **Jitsi Meet** | ~1s | WebRTC | ✅ Adaptive | Apache 2.0 | Self-hosted | ⭐⭐⭐ **BEST** |
| **Ant Media Server** | ~0.5s | WebRTC, SRT, RTMP | ✅ Adaptive | GPL/Commercial | Self-hosted | ⭐⭐ Good |
| **OvenMediaEngine** | <1s | WebRTC, LL-HLS | ✅ | GPL v2 | Self-hosted | ⭐⭐ Good |
| **OpenVidu** | <1s | WebRTC | ✅ | Apache 2.0 | Self-hosted | ⭐⭐ Good |

**Bandwidth Requirements**:
- 2G/3G: 360p @ 15fps = 128 kbps
- 3G/4G: 480p @ 20fps = 256 kbps
- 4G: 720p @ 30fps = 512 kbps

**Recommendation**: **Jitsi Meet** (adaptive streaming, free, well-documented)

---

## 6. Text-to-Speech (TTS) Solutions

| Solution | Languages | Hindi | Marathi | Tamil | Telugu | Offline | Open Source | Model Size | Recommendation |
|----------|-----------|-------|---------|-------|--------|---------|-------------|------------|----------------|
| **Bhashini API** | 22+ voice | ✅ | ✅ | ✅ | ✅ | ❌ API | ❌ Gov service | N/A | ⭐⭐⭐ **BEST** |
| **AI4Bharat Indic-TTS** | 13 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100-500 MB | ⭐⭐⭐ Offline |
| **Indic Parler-TTS** | 21 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 200-600 MB | ⭐⭐⭐ Offline |
| **Coqui XTTS-v2** | 17 | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | 1-2 GB | ⭐ No Marathi |
| **OpenAI Whisper** | 99 (STT only) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

**Recommendation**: **Bhashini API** (online) + **AI4Bharat Indic-TTS** (offline fallback)

---

## 7. Speech-to-Text (STT) Solutions

| Solution | Languages | Hindi | Marathi | Tamil | Telugu | Offline | Open Source | Model Size | Accuracy | Recommendation |
|----------|-----------|-------|---------|-------|--------|---------|-------------|------------|----------|----------------|
| **Bhashini API** | 22+ | ✅ | ✅ | ✅ | ✅ | ❌ API | ❌ | N/A | High | ⭐⭐⭐ **BEST** |
| **IndicWav2Vec** | 40 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ MIT | 300-500 MB | SOTA | ⭐⭐⭐ Offline |
| **Whisper (fine-tuned)** | 99 | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ MIT | 500 MB+ | High | ⭐⭐ Alternative |

**Recommendation**: **Bhashini API** (online) + **IndicWav2Vec** (offline fallback)

---

## 8. Edge AI Inference Frameworks

| Framework | Platform | Performance | Interoperability | Licensing | Use Case |
|-----------|----------|-------------|------------------|-----------|----------|
| **ONNX Runtime** | CPU/GPU/Mobile/Web | ⭐⭐⭐ Best CPU | ✅ PyTorch, TF, XGBoost | MIT | Backend server |
| **TensorFlow Lite** | Mobile/Edge | ⭐⭐⭐ Best Mobile | ⚠️ TF models | Apache 2.0 | Mobile app |
| **PyTorch Mobile** | Mobile | ⭐⭐ Good | ✅ PyTorch native | BSD | Mobile (PyTorch) |
| **WebAssembly + ONNX** | Browser | ⭐ Moderate | ✅ ONNX | MIT | Web demos |

**Recommendation**:
- **Backend**: ONNX Runtime (best CPU performance)
- **Mobile**: TensorFlow Lite (best hardware acceleration)

---

## 9. Complete Recommended Stack

### Phase 1: MVP (Online Mode)

| Component | Technology | Model/Service | Size/Cost | Priority |
|-----------|-----------|---------------|-----------|----------|
| **Video Streaming** | Jitsi Meet | Self-hosted | $200-400/mo | ⭐⭐⭐ |
| **Soil Classification** | ONNX Runtime | MobileNetV2 (custom) | 15 MB | ⭐⭐⭐ |
| **Crop Disease** | ONNX Runtime | YOLOv8n | 6.2 MB | ⭐⭐⭐ |
| **Cotton Pest** | ONNX Runtime | RF-Cott-Net | 4.8 MB | ⭐⭐⭐ |
| **Image Quality** | OpenCV | Laplacian Variance | N/A | ⭐⭐⭐ |
| **TTS/STT** | Bhashini API | Government service | API calls | ⭐⭐⭐ |
| **Backend** | AWS/GCP | 8-16 core CPU | $200-400/mo | ⭐⭐⭐ |

**Total Cost**: ~$400-800/month

### Phase 2: Enhanced (Offline Mode)

| Component | Technology | Model/Service | Size/Cost | Priority |
|-----------|-----------|---------------|-----------|----------|
| **Mobile Inference** | TensorFlow Lite | YOLOv8n (INT8) | 1.5 MB | ⭐⭐ |
| **Offline TTS** | AI4Bharat | Indic-TTS | 100-500 MB | ⭐⭐ |
| **Offline STT** | AI4Bharat | IndicWav2Vec | 300-500 MB | ⭐⭐ |
| **NPK Detection** | TensorFlow Lite | YOLOv8s (INT8) | 5 MB | ⭐⭐ |
| **Weed Detection** | TensorFlow Lite | PD-YOLO (INT8) | 5 MB | ⭐ |

**Mobile App Size**: ~1-2 GB total

---

## 10. Licensing Compatibility Matrix

| Technology | License | Commercial Use | Attribution | Copyleft | KisanMind Compatible |
|-----------|---------|----------------|-------------|----------|----------------------|
| **YOLOv8/v11** | AGPL-3.0 | ⚠️ Requires open source | ✅ | ✅ Strong | ⚠️ Need license |
| **YOLOv5** | GPL-3.0 | ⚠️ Requires open source | ✅ | ✅ | ⚠️ Need license |
| **TensorFlow/Lite** | Apache 2.0 | ✅ | ❌ | ❌ | ✅ |
| **ONNX Runtime** | MIT | ✅ | ❌ | ❌ | ✅ |
| **Jitsi Meet** | Apache 2.0 | ✅ | ❌ | ❌ | ✅ |
| **AI4Bharat** | MIT/Open | ✅ | ✅ | ❌ | ✅ |
| **PlantCV** | MPL 2.0 | ✅ | ✅ | ⚠️ File-level | ✅ |

**CRITICAL**: YOLOv8/v11 uses AGPL-3.0. Options:
1. Buy Ultralytics Enterprise License ($$$)
2. Open-source KisanMind (compatible with AGPL)
3. Use YOLOv5 (GPL-3.0, slightly less restrictive)
4. Train custom models with TensorFlow Object Detection API (Apache 2.0)

---

## 11. Performance Benchmarks (Target)

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| **Video Latency** | <1s | <2s | >3s |
| **ML Inference (per frame)** | <100ms | <300ms | >500ms |
| **Image Quality Check** | <10ms | <20ms | >50ms |
| **TTS Response** | <200ms | <500ms | >1s |
| **STT Recognition** | <500ms | <1s | >2s |
| **Total Assessment Time** | <5min | <10min | >15min |
| **Bandwidth (2G/3G)** | 128-256 kbps | 256-512 kbps | >1 Mbps |

---

## 12. Model Training Data Requirements

| Model | Training Images | Classes | Annotation Type | Collection Effort |
|-------|-----------------|---------|-----------------|-------------------|
| **Indian Soil Classifier** | 1,000-2,000 | 4-5 (black, red, alluvial, laterite, etc.) | Single-label | 🔴 High (field collection) |
| **Cotton Pest** | Use RF-Cott-Net | Pre-trained | - | ✅ Zero (use pre-trained) |
| **Rice Pest** | Use YOLOv5s-Ghost | Pre-trained | - | ✅ Zero (use pre-trained) |
| **General Crop Disease** | Use PlantVillage | 38 classes | Pre-trained | ✅ Zero (use pre-trained) |
| **NPK Deficiency** | 500-1,000 per crop | 3 (N, P, K) | Bounding boxes | 🟡 Medium (collect + annotate) |

**Priority**: Focus on Indian Soil Classifier (critical for MVP)

---

## 13. Quick Decision Matrix

### Use This Model If...

- **Soil Type Classification** → Train **MobileNetV2** on Indian soils (black cotton, laterite, alluvial, red)
- **Cotton Pest/Disease (Vidarbha)** → Use **RF-Cott-Net** (proven, India-specific)
- **Rice Pest/Disease** → Use **YOLOv5s-Ghost** (mobile-optimized)
- **General Crop Disease** → Use **YOLOv8n** on PlantVillage (smallest, fastest)
- **NPK Deficiency** → Fine-tune **YOLOv8s** on NPK dataset
- **Weed Detection** → Use **PD-YOLO** (cotton weeds)
- **Image Quality** → Use **OpenCV Laplacian Variance** (real-time)
- **Video Call** → Use **Jitsi Meet** (adaptive, free)
- **Voice (Hindi/Marathi)** → Use **Bhashini API** (online) + **Indic-TTS** (offline)
- **Speech Recognition** → Use **Bhashini API** (online) + **IndicWav2Vec** (offline)
- **Backend Inference** → Use **ONNX Runtime** (CPU-optimized)
- **Mobile Inference** → Use **TensorFlow Lite** (GPU-accelerated)

---

**Document Version**: 1.0
**Companion Document**: `video-land-assessment-comprehensive-research.md`
**Research Date**: February 12, 2026
