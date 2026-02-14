
import requests
import base64
import json

# Define the base64 images (simplified 1x1 pixels from previous step)
images = {
    "Dark": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQkxQBAACkAEwTa6+2AAAAAElFTkSuQmCC",
    "Red": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPYEmADAAL8AUETUyShAAAAAElFTkSuQmCC",
    "Bright": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGO4c2kLAATwAmP4hnYBAAAAAElFTkSuQmCC",
    "Green": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGMwWmAEAAIMAQWxtRjrAAAAAElFTkSuQmCC"
}

url_soil = "http://localhost:8100/analyze-soil"
url_crop = "http://localhost:8100/analyze-crop"

print("--- Testing Soil Analysis ---")
soil_types = set()
for name, b64 in images.items():
    if name == "Green": continue # Skip green for soil test
    
    # Create file object
    img_bytes = base64.b64decode(b64)
    files = {'image': ('test.png', img_bytes, 'image/png')}
    
    try:
        r = requests.post(url_soil, files=files)
        if r.status_code == 200:
            res = r.json()
            st = res.get("result", {}).get("soil_type", "Unknown")
            print(f"{name}: {st}")
            soil_types.add(st)
        else:
            print(f"{name}: Error {r.status_code} - {r.text}")
    except Exception as e:
        print(f"{name}: Failed - {e}")

print(f"Unique soil types: {len(soil_types)}")

print("\n--- Testing Crop Analysis (Green Image) ---")
b64 = images["Green"]
img_bytes = base64.b64decode(b64)
files = {'image': ('test.png', img_bytes, 'image/png')}
try:
    r = requests.post(url_crop, files=files)
    if r.status_code == 200:
        res = r.json()
        print(json.dumps(res, indent=2))
        
        # Check required fields
        result = res.get("result", {})
        req = ['health_score', 'assessment', 'growth_stage', 'detected_diseases', 'disease_count', 'recommendations', 'image_analysis']
        missing = [f for f in req if f not in result]
        if missing:
            print(f"MISSING FIELDS: {missing}")
        else:
            print("All required fields present.")
    else:
        print(f"Error {r.status_code} - {r.text}")
except Exception as e:
    print(f"Failed - {e}")
