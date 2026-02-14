"""
Re-export trained models in Keras 3 compatible format
Run this in your TRAINING environment (where the models were originally trained)
"""

import tensorflow as tf
import os

print("=" * 70)
print("KisanMind Model Re-Export Script")
print("=" * 70)
print(f"\nTensorFlow version: {tf.__version__}")
print(f"Keras version: {tf.keras.__version__}\n")

# Paths to your trained models (UPDATE THESE if different)
DOWNLOADS_PATH = os.path.expanduser("~/Downloads")
SOIL_MODEL_PATH = os.path.join(DOWNLOADS_PATH, "soil_classifier_densenet121_final.h5")
DISEASE_MODEL_PATH = os.path.join(DOWNLOADS_PATH, "cotton_disease_detector_mobilenetv2_final.h5")

# Output directory (will be created)
OUTPUT_DIR = os.path.join(DOWNLOADS_PATH, "kisanmind_models_compatible")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"Input: {DOWNLOADS_PATH}")
print(f"Output: {OUTPUT_DIR}\n")

# ==============================================================================
# 1. Re-export Soil Model
# ==============================================================================

print("[1/2] Loading soil classification model...")
try:
    soil_model = tf.keras.models.load_model(SOIL_MODEL_PATH, compile=False)
    print(f"  ✓ Loaded successfully")
    print(f"  Input shape: {soil_model.input_shape}")
    print(f"  Output shape: {soil_model.output_shape}")

    # Test prediction
    import numpy as np
    test_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
    test_pred = soil_model.predict(test_input, verbose=0)
    print(f"  ✓ Test prediction works! Output: {test_pred.shape}")

    # Save in SavedModel format (most compatible)
    savedmodel_path = os.path.join(OUTPUT_DIR, "soil_model_savedmodel")
    soil_model.save(savedmodel_path, save_format='tf')
    print(f"  ✓ Saved as SavedModel: {savedmodel_path}")

    # Also save as .keras format (Keras 3 native)
    keras_path = os.path.join(OUTPUT_DIR, "soil_model.keras")
    soil_model.save(keras_path, save_format='keras')
    print(f"  ✓ Saved as .keras: {keras_path}\n")

except Exception as e:
    print(f"  ✗ Error: {e}\n")
    print("  Please check the file path and try again.\n")

# ==============================================================================
# 2. Re-export Disease Model
# ==============================================================================

print("[2/2] Loading disease detection model...")
try:
    disease_model = tf.keras.models.load_model(DISEASE_MODEL_PATH, compile=False)
    print(f"  ✓ Loaded successfully")
    print(f"  Input shape: {disease_model.input_shape}")
    print(f"  Output shape: {disease_model.output_shape}")

    # Test prediction
    test_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
    test_pred = disease_model.predict(test_input, verbose=0)
    print(f"  ✓ Test prediction works! Output: {test_pred.shape}")

    # Save in SavedModel format
    savedmodel_path = os.path.join(OUTPUT_DIR, "disease_model_savedmodel")
    disease_model.save(savedmodel_path, save_format='tf')
    print(f"  ✓ Saved as SavedModel: {savedmodel_path}")

    # Also save as .keras format
    keras_path = os.path.join(OUTPUT_DIR, "disease_model.keras")
    disease_model.save(keras_path, save_format='keras')
    print(f"  ✓ Saved as .keras: {keras_path}\n")

except Exception as e:
    print(f"  ✗ Error: {e}\n")
    print("  Please check the file path and try again.\n")

# ==============================================================================
# Summary
# ==============================================================================

print("=" * 70)
print("EXPORT COMPLETE!")
print("=" * 70)
print(f"\nNew models saved in: {OUTPUT_DIR}")
print("\nWhat was created:")
print("  - soil_model_savedmodel/       (TensorFlow SavedModel format)")
print("  - soil_model.keras             (Keras 3 format)")
print("  - disease_model_savedmodel/    (TensorFlow SavedModel format)")
print("  - disease_model.keras          (Keras 3 format)")
print("\nNext steps:")
print("  1. Copy the 'kisanmind_models_compatible' folder to your KisanMind project")
print("  2. Let Claude know the export is done")
print("  3. I'll update the code to load these new formats")
print("\n" + "=" * 70)
