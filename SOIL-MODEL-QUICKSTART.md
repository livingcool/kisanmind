# 🚀 Soil Model Training - Quick Start

**Goal**: Train a soil classification model in 2 hours (100% FREE on Kaggle)

---

## 📋 Checklist (Follow in Order)

### ☐ Step 1: Create Kaggle Dataset (5 min)
1. Go to https://www.kaggle.com/datasets
2. Click "New Dataset"
3. Upload from `E:\2026\Claude-Hackathon\kisanmind\datasets\`:
   - `Sample1.jpg` to `Sample16.jpg` (all 16 images)
   - `Practical_Reading.csv`
4. Title: "Indian Soil Images"
5. Make Public → Save Version
6. Note your dataset URL: `yourusername/indian-soil-images`

---

### ☐ Step 2: Upload Notebook (2 min)
1. Go to https://www.kaggle.com/code
2. Click "New Notebook"
3. File → Upload Notebook
4. Select: `E:\2026\Claude-Hackathon\kisanmind\research\ml-training\kaggle-soil-training.ipynb`

---

### ☐ Step 3: Configure Notebook (3 min)
1. **Settings** (right sidebar) → Accelerator → **GPU T4 x2**
2. **Add Data** (right sidebar) → Search your dataset → Add
3. Find cell with `data_dir = '/kaggle/input/indian-soil-images'`
4. Change to your dataset path (e.g., `/kaggle/input/yourusername-indian-soil-images`)

---

### ☐ Step 4: Run Training (1-2 hours)
1. Click **"Run All"** at top
2. ☕ Take a break! Training runs automatically
3. Watch progress in output cells
4. Look for final message: "🎉 ALL CRITERIA PASSED!"

---

### ☐ Step 5: Download Model (2 min)
1. Scroll to bottom of notebook
2. Find: `kisanmind_soil_model_deployment.zip`
3. Right-click → Download
4. Save to your computer

---

### ☐ Step 6: Deploy (Later)
Follow: `research/ml-training/KAGGLE-TRAINING-GUIDE.md` Section 6

---

## 📱 Quick Commands

```bash
# Open in browser
start https://www.kaggle.com

# Dataset location
cd E:/2026/Claude-Hackathon/kisanmind/datasets
ls Sample*.jpg  # Should show 16 files

# Notebook location
cd E:/2026/Claude-Hackathon/kisanmind/research/ml-training
ls kaggle-soil-training.ipynb
```

---

## 🎯 What You'll Get

After 1-2 hours:
- ✅ Trained DenseNet121 soil classifier
- ✅ 90-95% accuracy (expected)
- ✅ ONNX model (production-ready)
- ✅ INT8 quantized (~8 MB)
- ✅ <100ms inference time
- ✅ Ready to deploy!

---

## ❓ Need Help?

📖 **Full Guide**: `research/ml-training/KAGGLE-TRAINING-GUIDE.md`

📊 **Training Status**: `TRAINING-STATUS.md`

📦 **Dataset Status**: `datasets/DATASET-DOWNLOAD-STATUS.md`

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Create dataset | 5 min |
| Upload notebook | 2 min |
| Configure | 3 min |
| Training | 60-120 min |
| Download | 2 min |
| **Total** | **~2 hours** |

---

**💪 Let's train that model! Start at Step 1! 🎓**
