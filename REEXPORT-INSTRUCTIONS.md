# 🔄 Model Re-Export Instructions

## Step-by-Step Guide

### Step 1: Go to Your Training Environment
Open the **same environment where you trained the models**:
- If you used Jupyter Notebook → Open that notebook
- If you used Google Colab → Open that Colab
- If you used VS Code → Open that terminal
- If you used Kaggle → Open that environment

### Step 2: Run the Re-Export Script

**Option A - Copy the script:**
1. Find `REEXPORT-MODELS-SCRIPT.py` in your KisanMind folder
2. Copy it to your training environment
3. Run: `python REEXPORT-MODELS-SCRIPT.py`

**Option B - Run inline:**
Just copy-paste this code in your training environment:

```python
import tensorflow as tf
import numpy as np
import os

# Paths (update if your models are elsewhere)
DOWNLOADS = os.path.expanduser("~/Downloads")
soil_model_path = os.path.join(DOWNLOADS, "soil_classifier_densenet121_final.h5")
disease_model_path = os.path.join(DOWNLOADS, "cotton_disease_detector_mobilenetv2_final.h5")

# Create output directory
output_dir = os.path.join(DOWNLOADS, "kisanmind_models_compatible")
os.makedirs(output_dir, exist_ok=True)

print("Loading and re-exporting models...\n")

# Re-export soil model
print("1. Soil model...")
soil_model = tf.keras.models.load_model(soil_model_path, compile=False)
soil_model.save(os.path.join(output_dir, "soil_model.keras"))
print("   ✓ Saved: soil_model.keras")

# Re-export disease model
print("2. Disease model...")
disease_model = tf.keras.models.load_model(disease_model_path, compile=False)
disease_model.save(os.path.join(output_dir, "disease_model.keras"))
print("   ✓ Saved: disease_model.keras")

print(f"\n✅ Done! Models saved in: {output_dir}")
print("Copy the 'kisanmind_models_compatible' folder to your KisanMind project.")
```

### Step 3: Copy the New Models
After running the script, you'll have a folder:
```
~/Downloads/kisanmind_models_compatible/
├── soil_model.keras              (new format)
└── disease_model.keras           (new format)
```

Copy this folder to your KisanMind project directory.

### Step 4: Tell Me When Done
Just type: **"Models re-exported and copied"**

Then I'll update the code to load the new format! ⚡

---

## 🔍 Troubleshooting

**"Command not found: python"**
→ Try `python3` or `py`

**"No module named 'tensorflow'"**
→ You're not in your training environment. Go to where you trained the models.

**"FileNotFoundError"**
→ Update the paths in the script to where your models actually are.

**"Cannot load model"**
→ That's okay! Just let me know and we'll try Option A (mock service) instead.

---

## ⏱️ This Should Take ~2 Minutes

1. Open training environment (30 sec)
2. Run script (1 min)
3. Copy folder (30 sec)

Then we're good to go! 🚀
