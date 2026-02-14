# KisanMind ML Training Quick Start Guide

**For**: Development Team
**Goal**: Train production-ready ML models in 2-4 weeks
**Models**: Soil classification + Crop disease detection
**Deployment**: Replace mock models in `services/ml-inference/app.py`

---

## Prerequisites

- **Python**: 3.9-3.11
- **GPU Access**: Google Colab Pro ($10/month) OR Kaggle (free)
- **Kaggle Account**: For dataset downloads
- **Git**: For cloning repositories
- **Storage**: 50-100 GB for datasets

---

## Week 1: Setup & Data Collection

### Step 1: Environment Setup (Day 1)

```bash
# Create virtual environment
python -m venv kisanmind-ml
source kisanmind-ml/bin/activate  # Linux/Mac
# kisanmind-ml\Scripts\activate  # Windows

# Install core dependencies
pip install tensorflow==2.15.0
pip install keras==2.15.0
pip install opencv-python
pip install albumentations
pip install scikit-learn
pip install matplotlib
pip install tf2onnx
pip install onnxruntime
```

### Step 2: Setup Kaggle API (Day 1)

```bash
# Install Kaggle CLI
pip install kaggle

# Get API credentials
# 1. Go to https://www.kaggle.com/account
# 2. Click "Create New API Token"
# 3. Save kaggle.json to ~/.kaggle/

# Linux/Mac
mkdir ~/.kaggle
mv ~/Downloads/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json

# Windows
mkdir %USERPROFILE%\.kaggle
move %USERPROFILE%\Downloads\kaggle.json %USERPROFILE%\.kaggle\
```

### Step 3: Download Datasets (Day 2-3)

```bash
# Create datasets directory
mkdir -p datasets/soil datasets/disease

# Download soil datasets
cd datasets/soil
kaggle datasets download kiranpandiri/indian-region-soil-image-dataset
kaggle datasets download ai4a-lab/comprehensive-soil-classification-datasets
unzip '*.zip'

# Download disease datasets
cd ../disease
kaggle datasets download emmarex/plantdisease  # PlantVillage (54K images)
kaggle datasets download janmejaybhoi/cotton-disease-dataset  # Cotton (2.6K images)
kaggle datasets download vbookshelf/rice-leaf-diseases  # Rice (5.9K images)
unzip '*.zip'

# Clone PlantDoc (real field conditions - CRITICAL)
cd ..
git clone https://github.com/pratikkayal/PlantDoc-Dataset.git
```

### Step 4: Organize Data (Day 4-5)

Create this structure:

```
datasets/
├── soil/
│   ├── train/
│   │   ├── black_cotton/
│   │   ├── red_soil/
│   │   ├── alluvial/
│   │   └── laterite/
│   ├── val/
│   └── test/
├── disease/
│   ├── plantvillage/
│   │   ├── train/
│   │   └── val/
│   ├── plantdoc/
│   │   ├── train/
│   │   └── val/
│   └── cotton/
│       ├── train/
│       │   ├── aphid/
│       │   ├── army_worm/
│       │   ├── bacterial_blight/
│       │   ├── healthy/
│       │   ├── powdery_mildew/
│       │   └── target_spot/
│       └── val/
```

**Use this script to split data** (70% train, 15% val, 15% test):

```python
import os
import shutil
from pathlib import Path
import random

def split_dataset(source_dir, output_dir, train_ratio=0.7, val_ratio=0.15):
    """Split dataset into train/val/test"""
    random.seed(42)

    for class_name in os.listdir(source_dir):
        class_path = os.path.join(source_dir, class_name)
        if not os.path.isdir(class_path):
            continue

        # Get all images
        images = [f for f in os.listdir(class_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
        random.shuffle(images)

        # Calculate splits
        n_train = int(len(images) * train_ratio)
        n_val = int(len(images) * val_ratio)

        train_images = images[:n_train]
        val_images = images[n_train:n_train + n_val]
        test_images = images[n_train + n_val:]

        # Create directories
        for split in ['train', 'val', 'test']:
            os.makedirs(os.path.join(output_dir, split, class_name), exist_ok=True)

        # Copy images
        for img in train_images:
            shutil.copy(os.path.join(class_path, img),
                       os.path.join(output_dir, 'train', class_name, img))
        for img in val_images:
            shutil.copy(os.path.join(class_path, img),
                       os.path.join(output_dir, 'val', class_name, img))
        for img in test_images:
            shutil.copy(os.path.join(class_path, img),
                       os.path.join(output_dir, 'test', class_name, img))

        print(f"{class_name}: {len(train_images)} train, {len(val_images)} val, {len(test_images)} test")

# Example usage
split_dataset('datasets/soil/raw', 'datasets/soil')
split_dataset('datasets/disease/cotton/raw', 'datasets/disease/cotton')
```

---

## Week 2: Model Training

### Model 1: Soil Classification (Day 6-8)

**Goal**: Train DenseNet121 for 4 Indian soil types
**Expected Accuracy**: 95-98%
**Training Time**: 2-3 hours on GPU

**Training Script** (`train_soil_model.py`):

```python
import tensorflow as tf
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras import layers, models
import albumentations as A

# Data augmentation
def augment_image(image, label):
    aug = A.Compose([
        A.RandomRotate90(p=0.5),
        A.Flip(p=0.5),
        A.ShiftScaleRotate(shift_limit=0.0625, scale_limit=0.2, rotate_limit=45, p=0.5),
        A.RandomBrightnessContrast(p=0.5),
        A.HueSaturationValue(p=0.3),
    ])
    augmented = aug(image=image.numpy())
    return augmented['image'], label

# Load datasets
train_ds = tf.keras.utils.image_dataset_from_directory(
    'datasets/soil/train',
    image_size=(224, 224),
    batch_size=32,
    label_mode='categorical'
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    'datasets/soil/val',
    image_size=(224, 224),
    batch_size=32,
    label_mode='categorical'
)

# Normalize
normalization_layer = tf.keras.layers.Rescaling(1./255)
train_ds = train_ds.map(lambda x, y: (normalization_layer(x), y))
val_ds = val_ds.map(lambda x, y: (normalization_layer(x), y))

# Build model
base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False  # Freeze initially

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(4, activation='softmax')  # 4 soil types
])

# Compile
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train phase 1 (frozen base)
print("Phase 1: Training with frozen base...")
history1 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=10,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint('soil_model_frozen.h5', save_best_only=True)
    ]
)

# Unfreeze and fine-tune
print("Phase 2: Fine-tuning entire model...")
base_model.trainable = True
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history2 = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=30,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint('soil_model_final.h5', save_best_only=True)
    ]
)

# Save final model
model.save('soil_classifier_densenet121.h5')
print("Soil model training complete!")
```

**Run on Google Colab**:
1. Upload script and datasets to Google Drive
2. Open Colab, enable GPU (Runtime > Change runtime type > T4 GPU)
3. Mount Drive: `from google.colab import drive; drive.mount('/content/drive')`
4. Run script: `python /content/drive/MyDrive/train_soil_model.py`

---

### Model 2: Crop Disease Detection (Day 9-13)

**Goal**: Train MobileNetV2 for crop diseases
**Expected Accuracy**: 94-97% (field conditions)
**Training Time**: 4-6 hours on GPU

**Training Script** (`train_disease_model.py`):

```python
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models

# Step 1: Pre-train on PlantVillage (large dataset)
print("Step 1: Pre-training on PlantVillage...")

plantvillage_train = tf.keras.utils.image_dataset_from_directory(
    'datasets/disease/plantvillage/train',
    image_size=(224, 224),
    batch_size=32,
    label_mode='categorical'
)

plantvillage_val = tf.keras.utils.image_dataset_from_directory(
    'datasets/disease/plantvillage/val',
    image_size=(224, 224),
    batch_size=32,
    label_mode='categorical'
)

# Normalize
normalization = tf.keras.layers.Rescaling(1./255)
plantvillage_train = plantvillage_train.map(lambda x, y: (normalization(x), y))
plantvillage_val = plantvillage_val.map(lambda x, y: (normalization(x), y))

# Build PlantVillage model
base_model_pv = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model_pv.trainable = False

model_pv = models.Sequential([
    base_model_pv,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.4),
    layers.Dense(38, activation='softmax')  # 38 PlantVillage classes
])

model_pv.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model_pv.fit(
    plantvillage_train,
    validation_data=plantvillage_val,
    epochs=20,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint('disease_model_plantvillage.h5', save_best_only=True)
    ]
)

print("PlantVillage pre-training complete!")

# Step 2: Fine-tune on Cotton dataset (Indian focus)
print("Step 2: Fine-tuning on Cotton dataset...")

cotton_train = tf.keras.utils.image_dataset_from_directory(
    'datasets/disease/cotton/train',
    image_size=(224, 224),
    batch_size=32,
    label_mode='categorical'
)

cotton_val = tf.keras.utils.image_dataset_from_directory(
    'datasets/disease/cotton/val',
    image_size=(224, 224),
    batch_size=32,
    label_mode='categorical'
)

cotton_train = cotton_train.map(lambda x, y: (normalization(x), y))
cotton_val = cotton_val.map(lambda x, y: (normalization(x), y))

# Load pre-trained weights
base_model_cotton = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model_cotton.trainable = True  # Fine-tune all layers

model_cotton = models.Sequential([
    base_model_cotton,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.4),
    layers.Dense(6, activation='softmax')  # 6 cotton disease classes
])

model_cotton.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model_cotton.fit(
    cotton_train,
    validation_data=cotton_val,
    epochs=30,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint('cotton_disease_final.h5', save_best_only=True)
    ]
)

model_cotton.save('cotton_disease_mobilenetv2.h5')
print("Cotton disease model training complete!")
```

---

## Week 3: Model Conversion & Optimization

### Step 1: Convert to ONNX (Day 14-15)

```bash
# Install converter
pip install tf2onnx

# Convert soil model
python -m tf2onnx.convert \
    --keras soil_classifier_densenet121.h5 \
    --output soil_classifier.onnx \
    --opset 13

# Convert disease model
python -m tf2onnx.convert \
    --keras cotton_disease_mobilenetv2.h5 \
    --output cotton_disease_detector.onnx \
    --opset 13
```

### Step 2: Quantize to INT8 (Day 16-17)

**Quantization Script** (`quantize_models.py`):

```python
from onnxruntime.quantization import quantize_dynamic, QuantType

# Quantize soil model
print("Quantizing soil model...")
quantize_dynamic(
    model_input='soil_classifier.onnx',
    model_output='soil_classifier_quantized.onnx',
    weight_type=QuantType.QInt8,
    optimize_model=True,
)

# Quantize disease model
print("Quantizing disease model...")
quantize_dynamic(
    model_input='cotton_disease_detector.onnx',
    model_output='cotton_disease_detector_quantized.onnx',
    weight_type=QuantType.QInt8,
    optimize_model=True,
)

print("Quantization complete!")
print("Expected size reduction: 75%")
print("Expected accuracy loss: <5%")
```

### Step 3: Validate Performance (Day 18-21)

**Validation Script** (`validate_models.py`):

```python
import onnxruntime as ort
import numpy as np
import time
from sklearn.metrics import accuracy_score, classification_report

def validate_onnx_model(onnx_path, test_dataset):
    """Validate ONNX model accuracy and speed"""
    session = ort.InferenceSession(onnx_path)
    input_name = session.get_inputs()[0].name

    predictions = []
    ground_truth = []
    inference_times = []

    for images, labels in test_dataset:
        for img, label in zip(images.numpy(), labels.numpy()):
            img = np.expand_dims(img, axis=0)

            # Measure inference time
            start = time.time()
            pred = session.run(None, {input_name: img})[0]
            inference_times.append(time.time() - start)

            predictions.append(np.argmax(pred))
            ground_truth.append(np.argmax(label))

    # Calculate metrics
    accuracy = accuracy_score(ground_truth, predictions)
    avg_inference_time = np.mean(inference_times) * 1000  # Convert to ms

    print(f"\nModel: {onnx_path}")
    print(f"Test Accuracy: {accuracy * 100:.2f}%")
    print(f"Average Inference Time: {avg_inference_time:.2f} ms")
    print("\nClassification Report:")
    print(classification_report(ground_truth, predictions))

    return accuracy, avg_inference_time

# Load test datasets
test_soil = tf.keras.utils.image_dataset_from_directory(
    'datasets/soil/test',
    image_size=(224, 224),
    batch_size=1,
    label_mode='categorical'
)

test_cotton = tf.keras.utils.image_dataset_from_directory(
    'datasets/disease/cotton/test',
    image_size=(224, 224),
    batch_size=1,
    label_mode='categorical'
)

# Validate models
print("Validating Soil Classifier...")
soil_acc, soil_time = validate_onnx_model('soil_classifier_quantized.onnx', test_soil)

print("\nValidating Cotton Disease Detector...")
cotton_acc, cotton_time = validate_onnx_model('cotton_disease_detector_quantized.onnx', test_cotton)

# Acceptance criteria
print("\n" + "="*50)
print("ACCEPTANCE CRITERIA CHECK:")
print("="*50)
print(f"Soil Model: {'✅ PASS' if soil_acc >= 0.93 and soil_time < 150 else '❌ FAIL'}")
print(f"  - Accuracy: {soil_acc*100:.1f}% (target: ≥93%)")
print(f"  - Inference: {soil_time:.1f}ms (target: <150ms)")

print(f"\nDisease Model: {'✅ PASS' if cotton_acc >= 0.92 and cotton_time < 150 else '❌ FAIL'}")
print(f"  - Accuracy: {cotton_acc*100:.1f}% (target: ≥92%)")
print(f"  - Inference: {cotton_time:.1f}ms (target: <150ms)")
```

**Acceptance Criteria**:
- ✅ Accuracy ≥93% (soil), ≥92% (disease)
- ✅ Inference time <150ms on CPU
- ✅ Model size <10 MB (quantized)

---

## Week 4: Deployment

### Step 1: Create Inference API (Day 22-23)

Create `services/ml-inference-real/app.py`:

```python
from fastapi import FastAPI, File, UploadFile, HTTPException
import onnxruntime as ort
import numpy as np
from PIL import Image
import io

app = FastAPI(title="KisanMind ML Inference Service - Real Models")

# Load models at startup
try:
    soil_session = ort.InferenceSession('models/soil_classifier_quantized.onnx')
    cotton_session = ort.InferenceSession('models/cotton_disease_detector_quantized.onnx')
    print("✅ Models loaded successfully")
except Exception as e:
    print(f"❌ Error loading models: {e}")

SOIL_CLASSES = ['Black Cotton Soil', 'Red Soil', 'Alluvial Soil', 'Laterite Soil']
COTTON_CLASSES = ['Aphid', 'Army Worm', 'Bacterial Blight', 'Healthy', 'Powdery Mildew', 'Target Spot']

def preprocess_image(image_bytes):
    """Preprocess image for model inference"""
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image = image.resize((224, 224))
    img_array = np.array(image).astype(np.float32)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.post("/predict/soil")
async def predict_soil(file: UploadFile = File(...)):
    """Predict soil type from image"""
    try:
        image_bytes = await file.read()
        input_tensor = preprocess_image(image_bytes)

        input_name = soil_session.get_inputs()[0].name
        outputs = soil_session.run(None, {input_name: input_tensor})[0]

        predicted_class_idx = np.argmax(outputs)
        confidence = float(outputs[0][predicted_class_idx])

        return {
            "soil_type": SOIL_CLASSES[predicted_class_idx],
            "confidence": confidence,
            "all_probabilities": {
                SOIL_CLASSES[i]: float(outputs[0][i]) for i in range(len(SOIL_CLASSES))
            },
            "recommendations": get_soil_recommendations(SOIL_CLASSES[predicted_class_idx])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/predict/cotton-disease")
async def predict_cotton_disease(file: UploadFile = File(...)):
    """Predict cotton disease from leaf image"""
    try:
        image_bytes = await file.read()
        input_tensor = preprocess_image(image_bytes)

        input_name = cotton_session.get_inputs()[0].name
        outputs = cotton_session.run(None, {input_name: input_tensor})[0]

        predicted_class_idx = np.argmax(outputs)
        confidence = float(outputs[0][predicted_class_idx])

        return {
            "disease": COTTON_CLASSES[predicted_class_idx],
            "confidence": confidence,
            "is_healthy": COTTON_CLASSES[predicted_class_idx] == "Healthy",
            "severity": "low" if confidence < 0.7 else "medium" if confidence < 0.9 else "high",
            "treatment": get_disease_treatment(COTTON_CLASSES[predicted_class_idx])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "models_loaded": True, "version": "real-v1.0"}

def get_soil_recommendations(soil_type):
    """Get crop recommendations based on soil type"""
    recommendations = {
        "Black Cotton Soil": ["Cotton", "Sugarcane", "Wheat", "Jowar"],
        "Red Soil": ["Groundnut", "Millets", "Pulses", "Oilseeds"],
        "Alluvial Soil": ["Rice", "Wheat", "Sugarcane", "Vegetables"],
        "Laterite Soil": ["Cashew", "Coconut", "Tea", "Coffee"]
    }
    return recommendations.get(soil_type, [])

def get_disease_treatment(disease):
    """Get treatment recommendations for disease"""
    treatments = {
        "Aphid": "Apply neem oil spray or imidacloprid pesticide",
        "Army Worm": "Use Bt-based insecticides or spinosad",
        "Bacterial Blight": "Apply copper-based fungicides and remove infected plants",
        "Healthy": "No treatment needed, continue regular monitoring",
        "Powdery Mildew": "Apply sulfur-based fungicide or potassium bicarbonate",
        "Target Spot": "Use chlorothalonil or mancozeb fungicide"
    }
    return treatments.get(disease, "Consult agricultural expert")
```

### Step 2: Deploy to Render (Day 24-25)

Create `services/ml-inference-real/requirements.txt`:

```
fastapi==0.109.0
uvicorn==0.27.0
python-multipart==0.0.6
onnxruntime==1.17.0
opencv-python-headless==4.9.0.80
Pillow==10.2.0
numpy==1.24.3
```

Create `services/ml-inference-real/Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy models
COPY models/ ./models/

# Copy application
COPY app.py .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Update `render.yaml`:

```yaml
services:
  - type: web
    name: kisanmind-ml-inference-real
    env: docker
    dockerfilePath: ./services/ml-inference-real/Dockerfile
    plan: starter  # $7/month, upgrade to standard ($21) for production
    healthCheckPath: /health
    envVars:
      - key: ONNXRUNTIME_NUM_THREADS
        value: 4
```

### Step 3: Deploy

```bash
# Commit changes
git add services/ml-inference-real/
git commit -m "Add real ML inference service with trained models"
git push

# Render will auto-deploy from render.yaml
# Access at: https://kisanmind-ml-inference-real.onrender.com
```

### Step 4: Integration Testing (Day 26-28)

Test deployed API:

```bash
# Test soil prediction
curl -X POST "https://kisanmind-ml-inference-real.onrender.com/predict/soil" \
  -F "file=@test_soil_image.jpg"

# Expected response
{
  "soil_type": "Black Cotton Soil",
  "confidence": 0.96,
  "all_probabilities": {
    "Black Cotton Soil": 0.96,
    "Red Soil": 0.02,
    "Alluvial Soil": 0.01,
    "Laterite Soil": 0.01
  },
  "recommendations": ["Cotton", "Sugarcane", "Wheat", "Jowar"]
}

# Test disease prediction
curl -X POST "https://kisanmind-ml-inference-real.onrender.com/predict/cotton-disease" \
  -F "file=@cotton_leaf.jpg"

# Expected response
{
  "disease": "Powdery Mildew",
  "confidence": 0.94,
  "is_healthy": false,
  "severity": "high",
  "treatment": "Apply sulfur-based fungicide or potassium bicarbonate"
}
```

### Step 5: Update KisanMind Orchestrator

Update `orchestrator/visual-intelligence.ts`:

```typescript
async function analyzeSoilImage(imageUrl: string) {
  const formData = new FormData();
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  formData.append('file', imageBlob);

  const mlResponse = await fetch(
    'https://kisanmind-ml-inference-real.onrender.com/predict/soil',
    { method: 'POST', body: formData }
  );

  const result = await mlResponse.json();
  return {
    soilType: result.soil_type,
    confidence: result.confidence,
    recommendations: result.recommendations
  };
}

async function analyzeCropDisease(imageUrl: string, crop: string) {
  const formData = new FormData();
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  formData.append('file', imageBlob);

  // Route to appropriate model endpoint
  const endpoint = crop === 'cotton'
    ? '/predict/cotton-disease'
    : '/predict/crop-disease';

  const mlResponse = await fetch(
    `https://kisanmind-ml-inference-real.onrender.com${endpoint}`,
    { method: 'POST', body: formData }
  );

  const result = await mlResponse.json();
  return {
    disease: result.disease,
    isHealthy: result.is_healthy,
    confidence: result.confidence,
    severity: result.severity,
    treatment: result.treatment
  };
}
```

---

## Success Metrics

After 4 weeks, you should have:

- ✅ **Soil Model**: 95-98% accuracy, <100ms inference, ~8 MB
- ✅ **Disease Model**: 94-97% accuracy, <150ms inference, ~4 MB
- ✅ **Deployed API**: Running on Render, accessible via HTTPS
- ✅ **Integration**: KisanMind orchestrator using real ML models
- ✅ **Cost**: $21/month (Render) + $10 one-time (training)

---

## Troubleshooting

### Issue: Low accuracy after training
**Solution**:
- Check data quality (blur, mislabeling)
- Increase training epochs
- Use stronger data augmentation
- Fine-tune on PlantDoc after PlantVillage

### Issue: Slow inference time
**Solution**:
- Ensure INT8 quantization is applied
- Use ONNX Runtime (2x faster than TensorFlow)
- Reduce image size to 224x224
- Upgrade Render plan for more CPU cores

### Issue: Model size too large
**Solution**:
- Apply quantization (75% reduction)
- Use MobileNetV2 instead of DenseNet121
- Remove unused layers
- Compress with gzip (additional 20-30% reduction)

### Issue: Out of memory during training
**Solution**:
- Reduce batch size (32 → 16 → 8)
- Use gradient checkpointing
- Train on Google Colab Pro (more RAM)
- Use MobileNetV2 instead of DenseNet121

---

## Next Steps (Post-4 Weeks)

1. **Collect Custom Data**: Real Indian farm images for fine-tuning
2. **Add More Crops**: Train models for rice, wheat, sugarcane
3. **Deploy Mobile Models**: TensorFlow Lite for on-device inference
4. **A/B Testing**: Compare new models vs current in production
5. **Continuous Learning**: Retrain quarterly with new data

---

## Resources

- **Full Knowledge Base**: `research/ml-training/ML-TRAINING-KNOWLEDGE-BASE.md`
- **Datasets Summary**: `research/ml-training/ml-training-datasets.md`
- **ONNX Runtime Docs**: https://onnxruntime.ai/docs/
- **TensorFlow Guides**: https://www.tensorflow.org/guide
- **Kaggle Datasets**: https://www.kaggle.com/datasets

---

**Questions?** Contact the research team or refer to the comprehensive ML Training Knowledge Base.
