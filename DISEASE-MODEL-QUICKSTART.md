# 🌾 Disease Detection Model Training - Quick Start

**Goal**: Train a cotton disease detection model in 4-6 hours (100% FREE on Kaggle)

**Strategy**: Two-phase transfer learning
1. **Phase 1**: Pre-train on PlantVillage (70K images, 38 classes) → Learn general disease features
2. **Phase 2**: Fine-tune on Cotton (2.3K images, 4 classes) → Specialize for Indian cotton

---

## 📋 Prerequisites

✅ Datasets extracted:
- PlantVillage: 87,867 images (extracted)
- Cotton Disease: 2,310 images (extracted)

---

## 📋 Checklist (Follow in Order)

### ☐ Step 1: Create Kaggle Datasets (10 min)

#### Upload PlantVillage Dataset

1. Go to https://www.kaggle.com/datasets
2. Click "New Dataset"
3. **Option A - Upload ZIP (RECOMMENDED)**:
   - Navigate to: `E:\2026\Claude-Hackathon\kisanmind\datasets\`
   - Re-zip PlantVillage:
     - Right-click `New Plant Diseases Dataset(Augmented)` folder
     - Send to → Compressed (zipped) folder
   - Upload the ZIP file to Kaggle
   - Title: "PlantVillage Disease Dataset"
   - Make Public → Save Version

4. **Option B - Upload via Kaggle CLI** (faster for large datasets):
   ```bash
   # Create dataset metadata
   cd "E:/2026/Claude-Hackathon/kisanmind/datasets"
   kaggle datasets init -p "New Plant Diseases Dataset(Augmented)"
   # Edit dataset-metadata.json with title "PlantVillage Disease Dataset"
   kaggle datasets create -p "New Plant Diseases Dataset(Augmented)"
   ```

5. Note your dataset URL: `yourusername/plantvillage-disease-dataset`

#### Upload Cotton Disease Dataset

1. Go to https://www.kaggle.com/datasets
2. Click "New Dataset"
3. Upload from `E:\2026\Claude-Hackathon\kisanmind\datasets\Cotton Disease\`
   - Upload the entire `Cotton Disease` folder (contains train/val/test)
4. Title: "Cotton Disease Dataset"
5. Make Public → Save Version
6. Note your dataset URL: `yourusername/cotton-disease-dataset`

---

### ☐ Step 2: Upload Notebook (2 min)

1. Go to https://www.kaggle.com/code
2. Click "New Notebook"
3. File → Upload Notebook
4. Select: `E:\2026\Claude-Hackathon\kisanmind\research\ml-training\kaggle-disease-training.ipynb`

---

### ☐ Step 3: Configure Notebook (5 min)

1. **Settings** (right sidebar) → Accelerator → **GPU T4 x2**

2. **Add Data** (right sidebar):
   - Search "plantvillage" → Add your PlantVillage dataset
   - Search "cotton disease" → Add your Cotton Disease dataset

3. **Update paths in notebook** (cell 3):
   - Find the cell with:
     ```python
     PLANTVILLAGE_BASE = '/kaggle/input/plantvillage-dataset/...'
     COTTON_BASE = '/kaggle/input/cotton-disease-dataset/...'
     ```
   - Update to match your dataset paths
   - **TIP**: Click on "Input" in right sidebar to see exact paths

4. **Verify paths** (run cell 4):
   - Should show: "✅ Found 38 disease classes" (PlantVillage)
   - Should show: "✅ Found 4 classes" (Cotton)

---

### ☐ Step 4: Run Training (4-6 hours)

1. Click **"Run All"** at top
2. ☕☕ Take a long break! This will take 4-6 hours
3. Watch progress in output cells:
   - **Phase 1**: Pre-training (2-3 hours)
   - **Phase 2**: Fine-tuning (1-2 hours)
   - **Conversion & Packaging**: (5-10 minutes)
4. Look for final message: "🎉 ALL CRITERIA PASSED!"

**Expected timeline**:
- Setup & data loading: 5-10 minutes
- Phase 1 training: 2-3 hours
- Phase 2 training: 1-2 hours
- ONNX conversion: 5 minutes
- Total: 4-6 hours

---

### ☐ Step 5: Download Model (2 min)

1. Scroll to bottom of notebook
2. Find: `kisanmind_cotton_disease_model_deployment.zip`
3. Right-click → Download
4. Save to your computer

---

### ☐ Step 6: Deploy (Later)

1. Extract downloaded ZIP
2. Copy files to: `models/disease/`
3. Update ML service
4. Test with sample images
5. Deploy to production!

---

## 📱 Quick Commands

```bash
# Open in browser
start https://www.kaggle.com

# Dataset locations
cd "E:/2026/Claude-Hackathon/kisanmind/datasets"
ls -d "New Plant Diseases Dataset(Augmented)/"  # PlantVillage
ls -d "Cotton Disease/"                          # Cotton Disease

# Notebook location
cd "E:/2026/Claude-Hackathon/kisanmind/research/ml-training"
ls kaggle-disease-training.ipynb

# Check dataset sizes
du -sh "New Plant Diseases Dataset(Augmented)/"  # ~4 GB
du -sh "Cotton Disease/"                          # ~150 MB
```

---

## 🎯 What You'll Get

After 4-6 hours:
- ✅ MobileNetV2 disease classifier (pre-trained + fine-tuned)
- ✅ 94-97% accuracy (expected)
- ✅ ONNX model (production-ready)
- ✅ INT8 quantized (~10-15 MB)
- ✅ <200ms inference time
- ✅ Ready to deploy!

**Models included**:
- `cotton_disease_detector_mobilenetv2_final.h5` - Keras model
- `cotton_disease_detector.onnx` - ONNX model
- `cotton_disease_detector_quantized.onnx` - Quantized for speed
- `cotton_classes.json` - Class mappings
- Training visualizations (confusion matrix, history)

---

## 🔬 Two-Phase Training Explained

### Why Two Phases?

**Problem**: Cotton Disease dataset is small (2,310 images)
**Solution**: Transfer learning in two stages

**Phase 1 - Pre-training on PlantVillage**:
- Large dataset (87,867 images)
- 38 disease classes (tomato, potato, apple, etc.)
- Controlled lab conditions
- **Goal**: Learn general features of diseased vs healthy plants
- **Output**: Model that understands disease patterns

**Phase 2 - Fine-tuning on Cotton**:
- Smaller dataset (2,310 images)
- 4 cotton-specific classes
- Real field conditions (Indian farms)
- **Goal**: Specialize for cotton diseases
- **Output**: Production model for Indian cotton farmers

**Result**: High accuracy despite small Cotton dataset!

---

## ❓ Troubleshooting

### Issue: "Dataset path not found"
**Solution**:
1. Click "Input" in right sidebar
2. Copy exact path shown
3. Update `PLANTVILLAGE_BASE` and `COTTON_BASE` in notebook

### Issue: "GPU quota exceeded"
**Solution**:
- Kaggle gives 30 hours/week free GPU
- Wait for weekly reset (Monday)
- Or upgrade to Kaggle Pro

### Issue: "Out of memory"
**Solution**:
- Reduce `BATCH_SIZE` from 32 to 16 or 8
- In Phase 2, already set to 16 (smaller dataset)

### Issue: "ONNX conversion failed"
**Solution**:
- Not critical! The Keras .h5 model works fine
- Can convert locally later
- ONNX is optional for deployment

---

## 💡 Advanced Options

### Modify training parameters (cell 3):

```python
# Train longer for better accuracy
EPOCHS_PHASE1 = 15  # Default: 10
EPOCHS_PHASE2 = 30  # Default: 20

# Use smaller batches if OOM
BATCH_SIZE = 16  # Default: 32

# Different image size (faster but less accurate)
IMG_SIZE = (192, 192)  # Default: (224, 224)
```

### Skip Phase 1 (use pre-trained weights):
If someone has already trained Phase 1, you can:
1. Download their Phase 1 model
2. Upload to Kaggle
3. Skip Phase 1 training section
4. Load Phase 1 model in Phase 2 section

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Create datasets | 10 min |
| Upload notebook | 2 min |
| Configure | 5 min |
| **Phase 1 training** | **2-3 hours** |
| **Phase 2 training** | **1-2 hours** |
| ONNX conversion | 5 min |
| Download | 2 min |
| **Total** | **~4-6 hours** |

---

## 📊 Expected Results

**Phase 1 (PlantVillage)**:
- Top-1 Accuracy: ~96%
- Top-3 Accuracy: ~99%
- 38 disease classes

**Phase 2 (Cotton)**:
- Test Accuracy: 94-97%
- 4 cotton disease classes:
  - diseased cotton leaf
  - diseased cotton plant
  - fresh cotton leaf
  - fresh cotton plant

---

## 🎓 Need Help?

📖 **Dataset Status**: `datasets/DATASETS-READY.md`

📊 **Training Guide**: `research/ml-training/KAGGLE-TRAINING-GUIDE.md`

📝 **Notebook**: `research/ml-training/kaggle-disease-training.ipynb`

---

**💪 Let's train that disease model! Start at Step 1! 🌾**

**Estimated completion**: 4-6 hours from start to finish

**Cost**: $0.00 (100% FREE on Kaggle GPU)

---

*Last Updated: 2026-02-13*
*Next: Deploy trained model to ML service*
