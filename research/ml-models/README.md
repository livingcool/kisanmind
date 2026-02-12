# Video-Based Land Assessment ML Research
## KisanMind Agricultural Platform

**Research Completed**: February 12, 2026
**Researcher**: Gemini Research Agent (Claude Sonnet 4.5)
**Status**: Production-Ready Recommendations

---

## 📁 Research Documents

### 1. [RECOMMENDED-STACK.md](./RECOMMENDED-STACK.md) ⭐ START HERE
**Quick implementation guide with code examples**
- TL;DR recommendations (which models to use)
- Week 1 quick start guide
- Complete code snippets (Jitsi, ONNX, Bhashini)
- Testing checklist
- 90-day roadmap
- Hackathon deliverables checklist

**Use this if**: You want to start building immediately

---

### 2. [model-comparison-matrix.md](./model-comparison-matrix.md)
**Quick reference tables comparing all models**
- Soil analysis models comparison
- Crop disease/pest detection comparison
- Video communication technologies
- TTS/STT solutions matrix
- Edge AI frameworks
- Complete recommended stack (Phase 1 & 2)
- Licensing compatibility matrix
- Performance benchmarks

**Use this if**: You need to compare options or make technical decisions

---

### 3. [video-land-assessment-comprehensive-research.md](./video-land-assessment-comprehensive-research.md)
**In-depth research report (44 KB, 15,000+ words)**
- Detailed analysis of 50+ models and technologies
- Soil analysis from images/video
- Crop health & disease detection models
- YOLO-based agriculture models (2026 SOTA)
- Agricultural computer vision frameworks
- Image quality assessment
- Real-time video communication stack
- Multi-language voice guidance (TTS/STT)
- Segment Anything Model for agriculture
- Edge AI / lightweight inference
- Implementation roadmap
- Known challenges & mitigation
- 50+ sources with links

**Use this if**: You need complete technical background and research sources

---

## 🎯 Key Findings Summary

### Best Models for KisanMind

| Component | Recommended Model | Accuracy | Size | Reason |
|-----------|-------------------|----------|------|--------|
| **Soil Type** | MobileNetV2 (custom) | 90%+ | 15 MB | Train on Indian soils |
| **Cotton Pest** | RF-Cott-Net | 98.4% | 4.8 MB | Vidarbha-specific |
| **Rice Pest** | YOLOv5s-Ghost | 93% F1 | 14 MB | Mobile-optimized |
| **General Crop** | YOLOv8n | 92%+ | 6.2 MB | Smallest YOLO |
| **NPK Deficiency** | YOLOv8s (fine-tuned) | 98%+ | 21.5 MB | High accuracy |
| **Video** | Jitsi Meet | N/A | N/A | Adaptive streaming |
| **Voice (Online)** | Bhashini API | High | N/A | 22+ Indian languages |
| **Voice (Offline)** | AI4Bharat Indic-TTS | SOTA | 100-500 MB | Hindi, Marathi, Tamil, Telugu |
| **Inference** | ONNX Runtime (backend) | N/A | N/A | Best CPU performance |
| | TensorFlow Lite (mobile) | N/A | N/A | Hardware acceleration |

### Critical Gotchas

1. **Licensing**: YOLOv8/v11 uses AGPL-3.0 → Must open-source KisanMind OR buy license
2. **Indian Soil Data**: Limited public datasets → Must collect 1,000+ images
3. **Bhashini**: API-only (not offline) → Need AI4Bharat as fallback
4. **Soil Nutrients**: Image-based NPK detection less accurate → Don't over-promise

### Budget Estimate

- **MVP (Online Mode)**: $400-800/month (backend server + Bhashini)
- **Enhanced (Offline)**: +$0 (one-time model downloads)
- **Data Collection**: 2-4 weeks for Indian soil dataset

---

## 🚀 Quick Start (Week 1)

1. **Set up Jitsi Meet** server (self-hosted)
2. **Register Bhashini API** (https://bhashini.gov.in/ulca)
3. **Download YOLOv8n** and test inference
4. **Start collecting Indian soil images** (partner with agricultural universities)
5. **Build React Native** mobile app shell with Jitsi SDK

See [RECOMMENDED-STACK.md](./RECOMMENDED-STACK.md) for detailed instructions.

---

## 📊 Research Scope

**Total Sources**: 50+ web sources, 20+ GitHub repositories, 15+ academic papers
**Research Areas**:
- Soil analysis from images (AgroSense, SoilNet, Light-SoilNet)
- Plant disease detection (PlantVillage, PlantDoc, YOLOv8/v11)
- Pest detection for Indian crops (RF-Cott-Net for cotton, YOLOv5s-Ghost for rice)
- Nutrient deficiency (NPK) detection (YOLOv8s, SRDL)
- Weed detection (PD-YOLO, OpenWeedGUI)
- Agricultural frameworks (FarmVibes.AI, AgML, PlantCV)
- Segment Anything Model (SAM) for agriculture
- Image quality assessment (OpenCV Laplacian, BRISQUE)
- WebRTC for rural networks (Jitsi, Ant Media Server, OvenMediaEngine)
- Multi-language TTS/STT (Bhashini, AI4Bharat Indic-TTS, IndicWav2Vec)
- Edge AI inference (ONNX Runtime, TensorFlow Lite)

---

## 🔗 Essential Links

### Government Resources
- **Bhashini** (TTS/STT): https://bhashini.gov.in/ulca
- **Bhashini API Docs**: https://bhashini.gitbook.io/bhashini-apis

### AI4Bharat (IIT Madras)
- **Indic-TTS**: https://github.com/AI4Bharat/Indic-TTS
- **IndicWav2Vec**: https://github.com/AI4Bharat/IndicWav2Vec
- **Indic Parler-TTS**: https://huggingface.co/ai4bharat/indic-parler-tts

### ML Frameworks
- **Ultralytics YOLOv8**: https://github.com/ultralytics/ultralytics
- **ONNX Runtime**: https://github.com/microsoft/onnxruntime
- **TensorFlow Lite**: https://www.tensorflow.org/lite

### Agricultural Frameworks
- **FarmVibes.AI**: https://github.com/microsoft/farmvibes-ai
- **AgML**: https://github.com/Project-AgML/AgML
- **PlantCV**: https://github.com/danforthcenter/plantcv

### Datasets
- **PlantVillage**: https://www.kaggle.com/datasets/emmarex/plantdisease
- **PlantDoc**: https://github.com/pratikkayal/PlantDoc-Dataset

### Video Communication
- **Jitsi Meet**: https://jitsi.github.io/handbook/docs/intro
- **Ant Media Server**: https://github.com/ant-media/Ant-Media-Server

---

## 📞 Next Steps

1. Review [RECOMMENDED-STACK.md](./RECOMMENDED-STACK.md)
2. Discuss licensing strategy (open-source vs. Ultralytics license)
3. Set up development environment (Jitsi + ONNX + Bhashini)
4. Plan Indian soil dataset collection (partner with universities)
5. Assign tasks to development team

---

## 🤝 Contributing to Research

Found a better model or discovered issues with recommendations? Update this research:

1. Test the alternative model
2. Document performance (accuracy, size, latency)
3. Compare with current recommendations
4. Update the relevant markdown file
5. Commit changes with clear notes

---

**Research Agent Memory**: `E:\2026\Claude-Hackathon\kisanmind\.claude\agent-memory\gemini-research-agent\MEMORY.md`

**Questions?** Consult the comprehensive research document or reach out to the research agent.
