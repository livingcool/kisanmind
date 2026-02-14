"""
Integration test for KisanMind ML Inference Service

Tests the ML service endpoints with actual HTTP requests to verify:
1. Service health check
2. Soil analysis endpoint (heuristic fallback)
3. Crop disease analysis endpoint (with or without trained model)
"""

import io
import sys
import time
import requests
from pathlib import Path
from PIL import Image
import numpy as np

# Service URL
ML_SERVICE_URL = "http://localhost:8100"

def create_test_image(color='green', size=(224, 224)):
    """Create a test image with a dominant color."""
    if color == 'green':
        # Green vegetation
        arr = np.random.randint(50, 150, (*size, 3), dtype=np.uint8)
        arr[:, :, 1] = np.random.randint(100, 200, size, dtype=np.uint8)  # More green
    elif color == 'brown':
        # Brown soil
        arr = np.random.randint(80, 130, (*size, 3), dtype=np.uint8)
        arr[:, :, 0] = np.random.randint(100, 150, size, dtype=np.uint8)  # More red
        arr[:, :, 2] = np.random.randint(50, 100, size, dtype=np.uint8)   # Less blue
    elif color == 'black':
        # Black soil
        arr = np.random.randint(20, 60, (*size, 3), dtype=np.uint8)
    else:
        # Default
        arr = np.random.randint(0, 255, (*size, 3), dtype=np.uint8)

    img = Image.fromarray(arr, 'RGB')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return buffer

def test_health_check():
    """Test the health check endpoint."""
    print("\n[Test 1/3] Health Check")
    print("-" * 60)

    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)

        if response.status_code == 200:
            data = response.json()
            print(f"  [OK] Service is healthy")
            print(f"  [OK] Version: {data.get('version')}")
            print(f"  [OK] Capabilities: {', '.join(data.get('capabilities', []))}")
            print(f"  [OK] Soil model: {data.get('models', {}).get('soil')}")
            print(f"  [OK] Disease model: {data.get('models', {}).get('disease')}")
            return True
        else:
            print(f"  [FAIL] Health check failed with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"  [FAIL] Could not connect to ML service at {ML_SERVICE_URL}")
        print(f"  -> Please start the service: cd services/ml-inference && py -m uvicorn app:app --port 8100")
        return False
    except Exception as e:
        print(f"  [FAIL] Error: {e}")
        return False

def test_soil_analysis():
    """Test the soil analysis endpoint with a mock soil image."""
    print("\n[Test 2/3] Soil Analysis")
    print("-" * 60)

    try:
        # Create a brown/black soil-like test image
        test_image = create_test_image('black')

        files = {'image': ('test_soil.jpg', test_image, 'image/jpeg')}
        data = {
            'latitude': '20.9374',
            'longitude': '77.7796',  # Vidarbha region
        }

        print(f"  -> Sending soil image to {ML_SERVICE_URL}/analyze-soil...")
        response = requests.post(
            f"{ML_SERVICE_URL}/analyze-soil",
            files=files,
            data=data,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print(f"  [OK] Analysis successful")
            print(f"  [OK] Processing time: {result.get('processing_time_ms')}ms")

            soil_result = result.get('result', {})
            print(f"  [OK] Soil type: {soil_result.get('soil_type')}")
            print(f"  [OK] Confidence: {soil_result.get('confidence'):.2%}")
            print(f"  [OK] Texture: {soil_result.get('texture')}")
            print(f"  [OK] pH: {soil_result.get('estimated_ph')}")
            print(f"  [OK] Drainage: {soil_result.get('drainage')}")
            print(f"  [OK] Suitable crops: {', '.join(soil_result.get('suitable_crops', [])[:3])}...")
            print(f"  [OK] Recommendations: {len(soil_result.get('recommendations', []))} items")
            return True
        else:
            print(f"  [FAIL] Analysis failed with status {response.status_code}")
            print(f"  [FAIL] Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"  [FAIL] Error: {e}")
        return False

def test_crop_analysis():
    """Test the crop disease analysis endpoint."""
    print("\n[Test 3/3] Crop Disease Analysis")
    print("-" * 60)

    try:
        # Create a green vegetation test image
        test_image = create_test_image('green')

        files = {'image': ('test_crop.jpg', test_image, 'image/jpeg')}
        data = {
            'crop_name': 'cotton',
            'latitude': '20.9374',
            'longitude': '77.7796',
        }

        print(f"  -> Sending crop image to {ML_SERVICE_URL}/analyze-crop...")
        response = requests.post(
            f"{ML_SERVICE_URL}/analyze-crop",
            files=files,
            data=data,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print(f"  [OK] Analysis successful")
            print(f"  [OK] Processing time: {result.get('processing_time_ms')}ms")

            crop_result = result.get('result', {})
            print(f"  [OK] Health score: {crop_result.get('health_score'):.2%}")
            print(f"  [OK] Assessment: {crop_result.get('assessment')}")
            print(f"  [OK] Growth stage: {crop_result.get('growth_stage')}")
            print(f"  [OK] Diseases detected: {crop_result.get('disease_count')}")

            model_info = crop_result.get('model_info', {})
            print(f"  [OK] Model: {model_info.get('model')}")

            if crop_result.get('detected_diseases'):
                print(f"  [OK] Disease details: {len(crop_result.get('detected_diseases'))} found")

            print(f"  [OK] Recommendations: {len(crop_result.get('recommendations', []))} items")
            return True
        else:
            print(f"  [FAIL] Analysis failed with status {response.status_code}")
            print(f"  [FAIL] Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"  [FAIL] Error: {e}")
        return False

def main():
    print("=" * 60)
    print("KisanMind ML Service Integration Test")
    print("=" * 60)

    # Wait a moment for service to be ready
    time.sleep(1)

    results = []

    # Run tests
    results.append(('Health Check', test_health_check()))
    results.append(('Soil Analysis', test_soil_analysis()))
    results.append(('Crop Analysis', test_crop_analysis()))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {test_name}")

    print("-" * 60)
    print(f"Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n[SUCCESS] All tests passed! ML service integration is working correctly.")
        print("\nThe service is using intelligent heuristics for analysis.")
        print("This provides reliable results without requiring trained models.")
        return 0
    else:
        print(f"\n[FAIL] {total - passed} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
