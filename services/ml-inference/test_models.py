"""
Test script to verify ML models are properly loaded and can perform inference.
Run this to test the integrated models.
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

print("="*70)
print("KisanMind ML Model Integration Test")
print("="*70)

# Test 1: Check model files exist
print("\n[1/5] Checking model files...")
models_dir = project_root / "models"

soil_model_path = models_dir / "soil" / "soil_classifier_densenet121_final.h5"
disease_model_path = models_dir / "disease" / "cotton_disease_detector_mobilenetv2_final.h5"

soil_classes_path = models_dir / "soil" / "soil_classes.json"
disease_classes_path = models_dir / "disease" / "disease_classes.json"

if soil_model_path.exists():
    print(f"  [OK] Soil model found: {soil_model_path.name}")
else:
    print(f"  [FAIL] Soil model NOT found at {soil_model_path}")

if disease_model_path.exists():
    print(f"  [OK] Disease model found: {disease_model_path.name}")
else:
    print(f"  [FAIL] Disease model NOT found at {disease_model_path}")

if soil_classes_path.exists():
    print(f"  [OK] Soil classes found")
else:
    print(f"  [FAIL] Soil classes NOT found")

if disease_classes_path.exists():
    print(f"  [OK] Disease classes found")
else:
    print(f"  [FAIL] Disease classes NOT found")

# Test 2: Check dependencies
print("\n[2/5] Checking Python dependencies...")

try:
    import numpy as np
    print(f"  [OK] NumPy {np.__version__}")
except ImportError as e:
    print(f"  [FAIL] NumPy not installed: {e}")
    sys.exit(1)

try:
    from PIL import Image
    print(f"  [OK] Pillow installed")
except ImportError as e:
    print(f"  [FAIL] Pillow not installed: {e}")
    sys.exit(1)

try:
    import tensorflow as tf
    print(f"  [OK] TensorFlow {tf.__version__}")
except ImportError as e:
    print(f"  [FAIL] TensorFlow not installed: {e}")
    print(f"\n  PLEASE INSTALL: py -m pip install tensorflow>=2.15.0")
    sys.exit(1)

try:
    import fastapi
    print(f"  [OK] FastAPI installed")
except ImportError as e:
    print(f"  [FAIL] FastAPI not installed: {e}")
    sys.exit(1)

# Test 3: Load models
print("\n[3/5] Loading models...")

try:
    soil_model = tf.keras.models.load_model(str(soil_model_path))
    print(f"  [OK] Soil model loaded successfully")
    print(f"    - Input shape: {soil_model.input_shape}")
    print(f"    - Output classes: {soil_model.output_shape[1]}")
except Exception as e:
    print(f"  [FAIL] Failed to load soil model: {e}")
    sys.exit(1)

try:
    disease_model = tf.keras.models.load_model(str(disease_model_path))
    print(f"  [OK] Disease model loaded successfully")
    print(f"    - Input shape: {disease_model.input_shape}")
    print(f"    - Output classes: {disease_model.output_shape[1]}")
except Exception as e:
    print(f"  [FAIL] Failed to load disease model: {e}")
    sys.exit(1)

# Test 4: Load class mappings
print("\n[4/5] Loading class mappings...")

import json

with open(soil_classes_path, 'r') as f:
    soil_classes_raw = json.load(f)
soil_classes = {v: k for k, v in soil_classes_raw.items()}
print(f"  [OK] Soil classes: {list(soil_classes.values())}")

with open(disease_classes_path, 'r') as f:
    disease_classes_raw = json.load(f)
disease_classes = {v: k for k, v in disease_classes_raw.items()}
print(f"  [OK] Disease classes: {list(disease_classes.values())}")

# Test 5: Test inference with dummy data
print("\n[5/5] Testing inference...")

# Create dummy 224x224 RGB image
dummy_image = np.random.randint(0, 255, (1, 224, 224, 3), dtype=np.float32) / 255.0

try:
    soil_predictions = soil_model.predict(dummy_image, verbose=0)
    predicted_soil_idx = int(np.argmax(soil_predictions[0]))
    predicted_soil = soil_classes[predicted_soil_idx]
    print(f"  [OK] Soil model inference successful")
    print(f"    - Predicted: {predicted_soil} (confidence: {soil_predictions[0][predicted_soil_idx]:.3f})")
except Exception as e:
    print(f"  [FAIL] Soil model inference failed: {e}")
    sys.exit(1)

try:
    disease_predictions = disease_model.predict(dummy_image, verbose=0)
    predicted_disease_idx = int(np.argmax(disease_predictions[0]))
    predicted_disease = disease_classes[predicted_disease_idx]
    print(f"  [OK] Disease model inference successful")
    print(f"    - Predicted: {predicted_disease} (confidence: {disease_predictions[0][predicted_disease_idx]:.3f})")
except Exception as e:
    print(f"  [FAIL] Disease model inference failed: {e}")
    sys.exit(1)

print("\n" + "="*70)
print("[SUCCESS] ALL TESTS PASSED! Models are ready for production use.")
print("="*70)
print("\nNext steps:")
print("  1. Start the ML service: cd services/ml-inference && py -m uvicorn app:app --port 8100")
print("  2. Start the API server: cd api-server && npm run dev")
print("  3. Start the frontend: cd frontend && npm run dev")
print("\n" + "="*70)
