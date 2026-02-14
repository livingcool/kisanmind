"""Quick test to debug model loading issues"""
import tensorflow as tf
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
models_dir = project_root / "models"

print("Testing model loading with different options...\n")

# Try loading soil model
soil_model_path = models_dir / "soil" / "soil_classifier_densenet121_final.h5"
print(f"1. Attempting to load: {soil_model_path}")

try:
    print("   Trying with compile=False...")
    soil_model = tf.keras.models.load_model(str(soil_model_path), compile=False)
    print(f"   [OK] Model loaded successfully!")
    print(f"   Input shape: {soil_model.input_shape}")
    print(f"   Output shape: {soil_model.output_shape}")

    # Try a test prediction
    import numpy as np
    dummy = np.random.rand(1, 224, 224, 3).astype(np.float32)
    pred = soil_model.predict(dummy, verbose=0)
    print(f"   [OK] Test prediction successful! Output shape: {pred.shape}")

except Exception as e:
    print(f"   [FAIL] Error: {e}")

print("\n" + "="*70)

# Try loading disease model
disease_model_path = models_dir / "disease" / "cotton_disease_detector_mobilenetv2_final.h5"
print(f"\n2. Attempting to load: {disease_model_path}")

try:
    print("   Trying with compile=False...")
    disease_model = tf.keras.models.load_model(str(disease_model_path), compile=False)
    print(f"   [OK] Model loaded successfully!")
    print(f"   Input shape: {disease_model.input_shape}")
    print(f"   Output shape: {disease_model.output_shape}")

    # Try a test prediction
    import numpy as np
    dummy = np.random.rand(1, 224, 224, 3).astype(np.float32)
    pred = disease_model.predict(dummy, verbose=0)
    print(f"   [OK] Test prediction successful! Output shape: {pred.shape}")

except Exception as e:
    print(f"   [FAIL] Error: {e}")
