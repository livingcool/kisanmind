"""
Quick tests for the ML inference service.
Run with: py test_app.py
"""

import io
import sys
from PIL import Image

# Import from app.py in same directory
from app import ImageFeatures, classify_soil, analyze_crop_health, _deterministic_seed


def create_test_image(color: tuple, size: tuple = (200, 200)) -> tuple:
    """Create a test image with a given solid color and return (Image, bytes)."""
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return img, buf.getvalue()


def test_soil_classification():
    """Test that different colored images produce different soil types."""
    print("Testing soil classification...")

    # Dark image -> should favor Black Cotton Soil
    dark_img, dark_bytes = create_test_image((30, 25, 20))
    dark_features = ImageFeatures(dark_img)
    dark_result = classify_soil(dark_features, _deterministic_seed(dark_bytes))
    print(f"  Dark image -> {dark_result['soil_type']} (confidence: {dark_result['confidence']})")
    assert dark_result["confidence"] >= 0.60
    assert dark_result["confidence"] <= 0.96
    assert len(dark_result["suitable_crops"]) > 0
    assert len(dark_result["recommendations"]) > 0

    # Reddish image -> should favor Red Soil
    red_img, red_bytes = create_test_image((180, 80, 60))
    red_features = ImageFeatures(red_img)
    red_result = classify_soil(red_features, _deterministic_seed(red_bytes))
    print(f"  Red image  -> {red_result['soil_type']} (confidence: {red_result['confidence']})")

    # Bright image -> should favor Sandy Loam
    bright_img, bright_bytes = create_test_image((220, 210, 180))
    bright_features = ImageFeatures(bright_img)
    bright_result = classify_soil(bright_features, _deterministic_seed(bright_bytes))
    print(f"  Bright img -> {bright_result['soil_type']} (confidence: {bright_result['confidence']})")

    # Verify different images produce different results
    types = {dark_result["soil_type"], red_result["soil_type"], bright_result["soil_type"]}
    print(f"  Unique soil types: {len(types)} (expected >= 2)")
    assert len(types) >= 2, "Expected at least 2 different soil types for diverse images"

    print("  PASSED\n")


def test_crop_health():
    """Test that crop health analysis works correctly."""
    print("Testing crop health analysis...")

    # Green image -> should be healthy
    green_img, green_bytes = create_test_image((50, 160, 50))
    green_features = ImageFeatures(green_img)
    green_result = analyze_crop_health(green_features, _deterministic_seed(green_bytes))
    print(f"  Green image -> health: {green_result['health_score']}, diseases: {green_result['disease_count']}")
    assert green_result["health_score"] >= 0.5, "Green image should have health >= 0.5"

    # Brown image -> should detect issues
    brown_img, brown_bytes = create_test_image((150, 90, 50))
    brown_features = ImageFeatures(brown_img)
    brown_result = analyze_crop_health(brown_features, _deterministic_seed(brown_bytes))
    print(f"  Brown image -> health: {brown_result['health_score']}, diseases: {brown_result['disease_count']}")
    assert len(brown_result["recommendations"]) > 0

    # Very bright/white -> possible mildew
    white_img, white_bytes = create_test_image((230, 230, 225))
    white_features = ImageFeatures(white_img)
    white_result = analyze_crop_health(white_features, _deterministic_seed(white_bytes))
    print(f"  White image -> health: {white_result['health_score']}, diseases: {white_result['disease_count']}")

    print("  All results have recommendations:", all(
        len(r["recommendations"]) > 0
        for r in [green_result, brown_result, white_result]
    ))
    print("  PASSED\n")


def test_deterministic():
    """Test that same image produces same results."""
    print("Testing determinism...")
    img, img_bytes = create_test_image((100, 80, 60))
    features = ImageFeatures(img)
    seed = _deterministic_seed(img_bytes)

    r1 = classify_soil(features, seed)
    r2 = classify_soil(features, seed)
    assert r1["soil_type"] == r2["soil_type"], "Same image should produce same soil type"
    assert r1["confidence"] == r2["confidence"], "Same image should produce same confidence"
    print("  Same image produces identical results: PASSED\n")


if __name__ == "__main__":
    try:
        test_soil_classification()
        test_crop_health()
        test_deterministic()
        print("All tests PASSED!")
        sys.exit(0)
    except AssertionError as e:
        print(f"FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
