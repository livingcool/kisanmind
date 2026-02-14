"""Test loading models with legacy Keras compatibility"""
import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'  # Force legacy Keras

import tensorflow as tf
from pathlib import Path
import numpy as np

print("Testing with LEGACY KERAS mode\n")
print(f"TensorFlow version: {tf.__version__}\n")

project_root = Path(__file__).parent.parent.parent
models_dir = project_root / "models"

# Test soil model
soil_model_path = models_dir / "soil" / "soil_classifier_densenet121_final.h5"
print(f"Loading soil model: {soil_model_path}")

try:
    soil_model = tf.keras.models.load_model(str(soil_model_path), compile=False)
    print(f"[OK] Soil model loaded!")
    print(f"     Input: {soil_model.input_shape}")
    print(f"     Output: {soil_model.output_shape}")

    # Test prediction
    dummy = np.random.rand(1, 224, 224, 3).astype(np.float32)
    pred = soil_model.predict(dummy, verbose=0)
    print(f"[OK] Prediction works! Shape: {pred.shape}\n")
except Exception as e:
    print(f"[FAIL] {e}\n")

# Test disease model
disease_model_path = models_dir / "disease" / "cotton_disease_detector_mobilenetv2_final.h5"
print(f"Loading disease model: {disease_model_path}")

try:
    disease_model = tf.keras.models.load_model(str(disease_model_path), compile=False)
    print(f"[OK] Disease model loaded!")
    print(f"     Input: {disease_model.input_shape}")
    print(f"     Output: {disease_model.output_shape}")

    # Test prediction
    dummy = np.random.rand(1, 224, 224, 3).astype(np.float32)
    pred = disease_model.predict(dummy, verbose=0)
    print(f"[OK] Prediction works! Shape: {pred.shape}\n")
except Exception as e:
    print(f"[FAIL] {e}\n")

print("="*70)
print("If both models loaded successfully, update app.py with:")
print("  os.environ['TF_USE_LEGACY_KERAS'] = '1'")
print("at the very top of the file!")
print("="*70)
