"""
Find and re-export models - Run this in your training environment
"""
import tensorflow as tf
import os
import glob

print("=" * 70)
print("Finding your trained models...")
print("=" * 70)

# Common locations to check
search_locations = [
    os.getcwd(),  # Current directory
    os.path.expanduser("~"),  # Home directory
    os.path.expanduser("~/Downloads"),
    "/content",  # Google Colab
    "/kaggle/working",  # Kaggle
    "/kaggle/input",
]

# Search for the models
soil_model_file = None
disease_model_file = None

print("\nSearching for models...\n")

for location in search_locations:
    if not os.path.exists(location):
        continue

    print(f"Checking: {location}")

    # Look for soil model
    soil_patterns = [
        "*soil*.h5",
        "*densenet*.h5",
        "soil_classifier*.h5"
    ]

    for pattern in soil_patterns:
        matches = glob.glob(os.path.join(location, "**", pattern), recursive=True)
        if matches:
            soil_model_file = matches[0]
            print(f"  ✓ Found soil model: {soil_model_file}")
            break

    # Look for disease model
    disease_patterns = [
        "*disease*.h5",
        "*cotton*.h5",
        "*mobilenet*.h5",
        "cotton_disease*.h5"
    ]

    for pattern in disease_patterns:
        matches = glob.glob(os.path.join(location, "**", pattern), recursive=True)
        if matches:
            disease_model_file = matches[0]
            print(f"  ✓ Found disease model: {disease_model_file}")
            break

    if soil_model_file and disease_model_file:
        break

print("\n" + "=" * 70)

if not soil_model_file or not disease_model_file:
    print("Could not find models automatically.")
    print("\nPlease manually locate your .h5 files and run:")
    print("""
import tensorflow as tf

# UPDATE THESE PATHS to where your models actually are:
soil_path = "/path/to/your/soil_model.h5"
disease_path = "/path/to/your/disease_model.h5"

# Create output directory
output_dir = "kisanmind_models_compatible"
import os
os.makedirs(output_dir, exist_ok=True)

# Re-export
soil = tf.keras.models.load_model(soil_path, compile=False)
soil.save(os.path.join(output_dir, "soil_model.keras"))
print("✓ Soil model saved!")

disease = tf.keras.models.load_model(disease_path, compile=False)
disease.save(os.path.join(output_dir, "disease_model.keras"))
print("✓ Disease model saved!")

print(f"Models saved in: {os.path.abspath(output_dir)}")
""")
else:
    print("Models found! Re-exporting now...\n")

    # Create output directory
    output_dir = "kisanmind_models_compatible"
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Re-export soil model
        print(f"Loading soil model from: {soil_model_file}")
        soil = tf.keras.models.load_model(soil_model_file, compile=False)
        soil_output = os.path.join(output_dir, "soil_model.keras")
        soil.save(soil_output)
        print(f"  ✓ Saved: {os.path.abspath(soil_output)}\n")

        # Re-export disease model
        print(f"Loading disease model from: {disease_model_file}")
        disease = tf.keras.models.load_model(disease_model_file, compile=False)
        disease_output = os.path.join(output_dir, "disease_model.keras")
        disease.save(disease_output)
        print(f"  ✓ Saved: {os.path.abspath(disease_output)}\n")

        print("=" * 70)
        print("SUCCESS! Models re-exported!")
        print("=" * 70)
        print(f"\nNew models location: {os.path.abspath(output_dir)}")
        print("\nFiles created:")
        print(f"  - {soil_output}")
        print(f"  - {disease_output}")
        print("\nNext: Copy the 'kisanmind_models_compatible' folder to your KisanMind project")

    except Exception as e:
        print(f"Error: {e}")
        print("\nTry the manual approach above with correct paths.")
