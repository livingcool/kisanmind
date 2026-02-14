"""
Kaggle Model Re-Export Script
Copy and run this in a Kaggle notebook cell
"""
import tensorflow as tf
import os
import glob

print("=" * 70)
print("KisanMind Model Re-Export (Kaggle)")
print("=" * 70)

# Create output directory
output_dir = "/kaggle/working/kisanmind_models_compatible"
os.makedirs(output_dir, exist_ok=True)

# ==============================================================================
# 1. Disease Model (FOUND)
# ==============================================================================
print("\n[1/2] Re-exporting disease detection model...")
disease_path = "/kaggle/working/cotton_disease_detector_mobilenetv2_final.h5"

try:
    disease = tf.keras.models.load_model(disease_path, compile=False)
    print(f"  ✓ Loaded: {disease_path}")
    print(f"  Input shape: {disease.input_shape}")
    print(f"  Output shape: {disease.output_shape}")

    # Save in new format
    disease.save(os.path.join(output_dir, "disease_model.keras"))
    print(f"  ✓ Saved as: disease_model.keras\n")
except Exception as e:
    print(f"  ✗ Error: {e}\n")

# ==============================================================================
# 2. Soil Model (SEARCH)
# ==============================================================================
print("[2/2] Searching for soil classification model...")

# Search for soil model
soil_patterns = [
    "/kaggle/working/*soil*.h5",
    "/kaggle/working/*densenet*.h5",
    "/kaggle/input/**/*soil*.h5",
    "/kaggle/input/**/*densenet*.h5"
]

soil_model_found = None
for pattern in soil_patterns:
    matches = glob.glob(pattern, recursive=True)
    if matches:
        soil_model_found = matches[0]
        print(f"  ✓ Found: {soil_model_found}")
        break

if soil_model_found:
    try:
        soil = tf.keras.models.load_model(soil_model_found, compile=False)
        print(f"  Input shape: {soil.input_shape}")
        print(f"  Output shape: {soil.output_shape}")

        # Save in new format
        soil.save(os.path.join(output_dir, "soil_model.keras"))
        print(f"  ✓ Saved as: soil_model.keras\n")
    except Exception as e:
        print(f"  ✗ Error: {e}\n")
else:
    print("  ✗ Soil model not found in /kaggle/working or /kaggle/input")
    print("\n  If you have a soil model, update the path below and run:")
    print("""
    soil = tf.keras.models.load_model("YOUR_SOIL_MODEL_PATH.h5", compile=False)
    soil.save("/kaggle/working/kisanmind_models_compatible/soil_model.keras")
    """)

# ==============================================================================
# Summary & Download Instructions
# ==============================================================================
print("=" * 70)
print("RE-EXPORT COMPLETE!")
print("=" * 70)
print(f"\nModels saved in: {output_dir}")
print("\nFiles created:")
for f in os.listdir(output_dir):
    print(f"  - {f}")

print("\n" + "=" * 70)
print("DOWNLOAD INSTRUCTIONS:")
print("=" * 70)
print("""
In Kaggle, you have 2 options to get these files:

Option A - Download via Kaggle UI:
1. Look at the output panel on the right →
2. Click on 'kisanmind_models_compatible' folder
3. Download both .keras files

Option B - Create a dataset:
1. Click 'Save Version' (top right)
2. Wait for notebook to finish
3. Go to 'Output' tab
4. Click 'New Dataset' to save the models
5. Download from your datasets

Then copy the files to your KisanMind project:
E:\\2026\\Claude-Hackathon\\kisanmind\\models\\
""")
