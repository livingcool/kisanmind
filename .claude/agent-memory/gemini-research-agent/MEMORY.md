# Gemini Research Agent Memory

## API Research Patterns (Updated: 2026-02-12)

### Reliable Agricultural ML Models (2026)
- **YOLOv8/v11 (Ultralytics)**: SOTA for crop/pest detection, BUT uses AGPL-3.0 license (requires open source or paid license)
- **RF-Cott-Net**: 98.4% accuracy for cotton pest detection, 4.8 MB, 3.8ms inference - CRITICAL for Vidarbha region
- **PlantVillage Dataset**: 54K images, 38 classes, widely used benchmark (EfficientNet achieves 99.97%)
- **PlantDoc Dataset**: 2.5K images for field conditions (more realistic than PlantVillage)

### Indian Language AI (Government-Backed)
- **Bhashini**: Government of India TTS/STT API, 22+ voice languages, migrated to Yotta Indian cloud (Jan 2026)
  - Real-world deployment: Kumbh Sah'AI'yak chatbot (11 languages)
  - API access: https://bhashini.gitbook.io/bhashini-apis
  - Best for production (free/low-cost for public projects)
- **AI4Bharat Indic-TTS**: Open source, 13 languages (includes Marathi ✅), offline-capable
- **AI4Bharat IndicWav2Vec**: 40 Indian languages STT, MIT license, SOTA on benchmarks

### WebRTC for Rural Networks
- **Jitsi Meet**: Best for adaptive streaming (SFU architecture), Apache 2.0, self-hosted
  - Handles 2G/3G via adaptive bitrate (start 128 kbps, scale to 512 kbps)
  - Built-in TURN/STUN server support
- **Ant Media Server**: Lower latency (~0.5s) but more complex setup

### Edge AI Deployment
- **ONNX Runtime**: Best CPU performance, cross-platform, MIT license
- **TensorFlow Lite (LiteRT)**: Best for mobile (Android/iOS), hardware acceleration
- **Quantization**: INT8 reduces model size by 4x (YOLOv8n: 6.2 MB → 1.5 MB)

### Agricultural AI Frameworks
- **Microsoft FarmVibes.AI**: Multi-modal geospatial ML, 30+ dataset workflows, BUT requires Kubernetes (complex)
- **PlantCV**: Plant phenotyping, v4.10.2 (Jan 2026), modular Python library, MPL 2.0
- **AgML**: Centralized framework for agricultural ML, iNatAg dataset (4.7M images), TensorFlow/PyTorch support

### Image Quality Assessment
- **OpenCV Laplacian Variance**: Real-time blur detection (milliseconds), threshold <100 = blurry
- **BRISQUE**: No-reference quality metric, implemented in OpenCV 4.x+

## Critical Gotchas

### Licensing Issues
- ⚠️ **YOLOv8/v11 is AGPL-3.0**: Requires entire app to be open source OR buy Ultralytics Enterprise License
- Solution: Open-source KisanMind OR use Apache 2.0 alternatives (TF Object Detection API)

### Dataset Limitations
- **PlantVillage**: Clean backgrounds, single leaves → Lower accuracy in real field conditions
- **Indian Soil Data**: Limited public datasets → Must collect custom data for black cotton, laterite, alluvial, red soils
- **NPK Detection**: Requires crop-specific training data (500-1K images per crop)

### Deployment Constraints
- **Bhashini**: API-only (not offline) → Need AI4Bharat Indic-TTS/IndicWav2Vec as fallback
- **Soil Classification**: Image-based accuracy ~95-98% for soil type, but NOT reliable for NPK levels from images alone
- **2G/3G Rural Networks**: Must start at 360p/15fps/128kbps, auto-upgrade if bandwidth allows

## Domain Knowledge: Indian Agriculture

### Critical Crops by Region
- **Vidarbha (Maharashtra)**: Cotton (dominant), frequent pest issues → RF-Cott-Net is MUST-HAVE
- **Telangana/Andhra Pradesh**: Rice → YOLOv5s-Ghost for rice pest detection
- **Punjab/Haryana**: Wheat, rice → General models (YOLOv8n + PlantVillage)

### Soil Types in India
- **Black Cotton Soil**: High clay content, poor drainage, common in Vidarbha
- **Laterite Soil**: Iron-rich, acidic, found in Western Ghats
- **Alluvial Soil**: Fertile, Indo-Gangetic plains
- **Red Soil**: Sandy, low fertility, Deccan Plateau

### Government Schemes (Validate with Scheme MCP Server)
- PM-KISAN: Direct benefit transfer
- PMFBY: Crop insurance
- Drip irrigation subsidies
- Kisan Credit Card

## Integration Strategies

### MVP Stack (Phase 1)
```
Jitsi Meet (video) → ONNX Runtime (backend inference)
    ↓
YOLOv8n (crop disease) + RF-Cott-Net (cotton) + MobileNetV2 (soil)
    ↓
Bhashini API (TTS/STT Hindi/Marathi)
    ↓
Claude Opus 4.6 (synthesis + recommendations)
```

### Cost Estimates
- Backend server (8-16 core CPU): $200-400/month
- GPU (optional, NVIDIA T4): +$350/month
- Bhashini API: Free/low-cost for public projects
- Total MVP: ~$400-800/month

## Research Quality Notes

### High-Quality Sources (2025-2026)
- Nature Scientific Reports (peer-reviewed, recent agricultural ML)
- MDPI journals (Agronomy, Plants, Sensors) - open access, fast publication
- AI4Bharat (IIT Madras) - reliable Indian language AI
- Ultralytics GitHub - active maintenance, good documentation

### Emerging Trends (2026)
- YOLOv11 released (2% faster than v10, better small object detection)
- SAM (Segment Anything Model) adapted for agriculture (ARAMSAM tool)
- Bhashini migrated to Indian cloud (data sovereignty)
- TensorFlow Lite rebranded to "LiteRT" (supports PyTorch, JAX, Keras)

## Links to Detailed Research
- Full research document: `E:\2026\Claude-Hackathon\kisanmind\research\ml-models\video-land-assessment-comprehensive-research.md`
- Model comparison matrix: `E:\2026\Claude-Hackathon\kisanmind\research\ml-models\model-comparison-matrix.md`
- Video-based land assessment: `E:\2026\Claude-Hackathon\kisanmind\research\api-research\ml-models\video-based-land-assessment-research.md` (Feb 12, 2026)

## Latest Research Session (Feb 12, 2026)

### Real-Time Video Guidance System Findings

**Image Quality Feedback**:
- Laplacian variance: < 50ms latency, suitable for real-time overlay on video stream
- FFT-based blur detection: More robust but ~200ms latency
- BRISQUE (0-100 quality score): Best for final image acceptance before upload
- Implementation: BlurDetection2 (github.com/WillBrennan/BlurDetection2) - NumPy/OpenCV only

**WebRTC for Low-Bandwidth**:
- Simple-Peer: Best starting point for basic video streaming (8k+ stars, MIT license)
- Jitsi Meet: Production-grade adaptive streaming (handles 2G/3G automatically)
- OpenVidu: Easier than Jitsi for custom integrations, ultra-low latency
- Free TURN servers: Open Relay (500 MB/month), ExpressTURN (1000 GB/month), Turnix (10 GB)
- CRITICAL: 80% of connections work with STUN only; TURN is expensive fallback

**Deployment Size Constraints**:
- RDRM-YOLO (rice): 7.9 MB, 94.3% accuracy, 93.5% mAP - IDEAL for mobile
- EfficientNetV2-B0: ~25 MB, 98% accuracy (PlantVillage)
- Whisper Small: ~500 MB (acceptable for server-side, too large for mobile)
- AI4Bharat Indic-TTS: ~100 MB per language

**WebAssembly for Browser Deployment**:
- ONNX Runtime Web + WebGPU: Near-native inference speed
- TensorFlow.js: WebGL/WebGPU backends, seamless TensorFlow integration
- 6x performance gain over JavaScript for image processing
- Privacy advantage: User data stays local (no server upload)

**Soil Classification Discovery**:
- OMIII1997/Soil-Type-Classification: 903 images, 4 Indian soil types, multi-language crop recommendations
- Deployed on Heroku: https://soilnet.herokuapp.com/ (reference architecture)
- Nutrient prediction: yousaf2018's project shows NPK prediction from images possible (1,064 labeled samples)
- LIMITATION: Soil moisture affects color; requires well-lit close-ups

**Cotton Disease Detection Gap**:
- CPD-YOLO: Supports UAV + smartphone imaging (bidirectional FPN, reparameterization vision transformer)
- Improved YOLOv8n: Small target detection in complex fields (Triple Feature Encoding module)
- PlantDoc shows 31% accuracy improvement over PlantVillage for field conditions
- NOTE: Most cotton models still research-phase; fewer production-ready options vs rice/wheat

**Speech Recognition for Agriculture**:
- Whisper Hindi fine-tuned: 2,500 hrs training on KathBath dataset
- Indic Normalization: Preserves diacritics (critical for Hindi/Marathi)
- LIMITATION: Agricultural jargon (crop/disease names) needs custom vocabulary
- Solution: Fine-tune on agricultural voice corpus (to be collected)

### Updated Recommendations

**Phase 1 Architecture Changes**:
- Image Quality: Deploy Laplacian variance client-side (JavaScript) for real-time feedback
- Soil: Use OMIII1997's model as starting point (already supports 6 languages)
- Disease: Start with EfficientNetV2-B0 (PlantVillage) server-side
- Video: Skip WebRTC for MVP; use simple image upload with progress indicator
- Voice: Whisper Small (server) + AI4Bharat TTS (server)

**Phase 2 Enhancements**:
- Deploy RDRM-YOLO for rice via ONNX Runtime Mobile (7.9 MB fits 3G download)
- Add Simple-Peer for optional live video guidance (expert consultation feature)
- Fine-tune Whisper on agricultural vocabulary corpus
- Implement progressive model loading (WiFi-only for large models)

**Phase 3 - Advanced**:
- Browser-based inference using ONNX Runtime Web + WebGPU (privacy-first)
- Integrate SpaceEye from FarmVibes.AI for satellite cloud removal
- Deploy PlantDoc dataset models for multi-disease detection per leaf
- Expert video consultation via OpenVidu

### Critical Insights

1. **Dataset Realism Gap**: PlantVillage (54K images) is lab-controlled; PlantDoc (2.5K images) shows 31% accuracy gain for field conditions → MUST collect real Indian farm images
2. **Model Size vs Network**: Rural 3G can't reliably download > 10 MB; quantization essential (INT8 reduces 4x)
3. **Voice Complexity**: Generic models fail on agricultural terms; need domain-specific fine-tuning
4. **WebRTC Overkill**: For land assessment, static image upload sufficient; live video adds complexity without clear benefit (unless expert consultation)
5. **Indian Language TTS Winner**: AI4Bharat > Coqui (13 languages vs 1)
6. **Edge Deployment Maturity**: ONNX Runtime Mobile and TensorFlow Lite both production-ready; gap narrowing

### Data Collection Priorities

1. Indian farm field images (variable lighting, backgrounds, angles) for model fine-tuning
2. Cotton disease images from Vidarbha region (underrepresented in global datasets)
3. Agricultural voice corpus (Hindi/Marathi crop/disease terminology)
4. Soil images with lab-validated nutrient levels (for NPK prediction training)
5. Small farm satellite imagery (< 1 acre; current datasets focus on large farms)
