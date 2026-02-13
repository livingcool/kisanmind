"""
KisanMind ML Inference Service

A FastAPI service that provides soil classification and crop disease detection
from farmer-uploaded images. For the hackathon demo, this uses image property
analysis (color histograms, brightness, texture patterns) combined with
domain-knowledge heuristics to return realistic mock responses.

Post-hackathon, the mock analyzers can be replaced with real ML models
(e.g., fine-tuned EfficientNet for soil classification, YOLOv8 for crop
disease detection) without any API contract changes.

Endpoints:
  POST /analyze-soil  - Soil type, texture, pH estimate, recommendations
  POST /analyze-crop  - Crop disease detection, health score
  GET  /health        - Health check
"""

import io
import hashlib
import time
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageStat

app = FastAPI(
    title="KisanMind ML Inference",
    description="Soil classification and crop health analysis from images",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Image analysis helpers
# ---------------------------------------------------------------------------

class ImageFeatures:
    """Extract features from an image that drive mock ML classification."""

    def __init__(self, image: Image.Image):
        self.image = image.convert("RGB")
        stat = ImageStat.Stat(self.image)
        self.mean_r, self.mean_g, self.mean_b = stat.mean
        self.std_r, self.std_g, self.std_b = stat.stddev
        self.brightness = (self.mean_r + self.mean_g + self.mean_b) / 3.0
        self.width, self.height = self.image.size
        # Dominant hue analysis
        self.redness = self.mean_r / max(self.brightness, 1)
        self.greenness = self.mean_g / max(self.brightness, 1)
        self.blueness = self.mean_b / max(self.brightness, 1)
        # Texture roughness proxy: standard deviation across channels
        self.texture_variance = (self.std_r + self.std_g + self.std_b) / 3.0
        # Saturation proxy
        max_channel = max(self.mean_r, self.mean_g, self.mean_b)
        min_channel = min(self.mean_r, self.mean_g, self.mean_b)
        self.saturation = (max_channel - min_channel) / max(max_channel, 1)


def _deterministic_seed(img_bytes: bytes) -> int:
    """Create a deterministic seed from image content for reproducibility."""
    return int(hashlib.md5(img_bytes).hexdigest()[:8], 16)


# ---------------------------------------------------------------------------
# Soil classification logic (mock with heuristics)
# ---------------------------------------------------------------------------

SOIL_TYPES = [
    {
        "type": "Black Cotton Soil (Vertisol)",
        "description": "Deep black soil rich in clay, excellent moisture retention",
        "suitable_crops": ["Cotton", "Soybean", "Sorghum", "Wheat", "Chickpea", "Sunflower"],
        "ph_range": (7.5, 8.5),
        "organic_carbon_pct": (0.4, 0.8),
        "drainage": "poor",
        "india_regions": ["Vidarbha", "Marathwada", "Madhya Pradesh", "Gujarat"],
    },
    {
        "type": "Red Soil (Alfisol)",
        "description": "Iron-rich reddish soil with moderate fertility",
        "suitable_crops": ["Groundnut", "Millets", "Pulses", "Tobacco", "Potato", "Rice"],
        "ph_range": (5.5, 7.0),
        "organic_carbon_pct": (0.3, 0.6),
        "drainage": "moderate",
        "india_regions": ["Tamil Nadu", "Karnataka", "Andhra Pradesh", "Odisha"],
    },
    {
        "type": "Alluvial Soil",
        "description": "Fertile, well-drained soil deposited by rivers",
        "suitable_crops": ["Rice", "Wheat", "Sugarcane", "Maize", "Vegetables", "Jute"],
        "ph_range": (6.0, 7.5),
        "organic_carbon_pct": (0.5, 1.0),
        "drainage": "good",
        "india_regions": ["Punjab", "Uttar Pradesh", "Bihar", "West Bengal"],
    },
    {
        "type": "Laterite Soil",
        "description": "Leached acidic soil, common in high-rainfall areas",
        "suitable_crops": ["Tea", "Coffee", "Rubber", "Cashew", "Coconut", "Arecanut"],
        "ph_range": (4.5, 6.0),
        "organic_carbon_pct": (0.2, 0.5),
        "drainage": "excessive",
        "india_regions": ["Kerala", "Konkan", "Goa", "Meghalaya"],
    },
    {
        "type": "Sandy Loam",
        "description": "Light-textured soil with good drainage, low water retention",
        "suitable_crops": ["Bajra", "Jowar", "Guar", "Mustard", "Cumin", "Groundnut"],
        "ph_range": (6.5, 8.0),
        "organic_carbon_pct": (0.2, 0.4),
        "drainage": "excessive",
        "india_regions": ["Rajasthan", "Haryana", "Gujarat (Kutch)"],
    },
]


def classify_soil(features: ImageFeatures, seed: int) -> dict:
    """
    Classify soil type based on image color features.

    Heuristic logic:
    - Dark images (low brightness, low saturation) -> Black Cotton Soil
    - Red-tinted images -> Red Soil
    - Light brownish (moderate brightness, low saturation) -> Alluvial
    - Red-orange with high variance -> Laterite
    - Very bright / high saturation light -> Sandy Loam
    """
    rng = np.random.RandomState(seed)

    # Scoring each soil type based on image features
    scores = []

    # Black Cotton: dark, low saturation, high texture variance
    black_score = (
        (1.0 - features.brightness / 255.0) * 2.0
        + (1.0 - features.saturation) * 1.0
        + min(features.texture_variance / 60.0, 1.0) * 0.5
    )
    scores.append(black_score)

    # Red Soil: high redness, moderate brightness
    red_score = (
        features.redness * 2.0
        + (1.0 - abs(features.brightness - 120) / 120.0) * 1.0
        - features.greenness * 0.5
    )
    scores.append(red_score)

    # Alluvial: moderate everything, slightly green-brown
    alluvial_score = (
        (1.0 - abs(features.brightness - 140) / 140.0) * 1.5
        + (1.0 - features.saturation) * 0.5
        + (1.0 - abs(features.redness - features.greenness)) * 1.0
    )
    scores.append(alluvial_score)

    # Laterite: reddish-orange, high texture variance
    laterite_score = (
        features.redness * 1.5
        + features.saturation * 1.0
        + min(features.texture_variance / 70.0, 1.0) * 1.0
        - features.greenness * 0.3
    )
    scores.append(laterite_score)

    # Sandy: very bright, low texture variance
    sandy_score = (
        (features.brightness / 255.0) * 2.0
        + (1.0 - min(features.texture_variance / 40.0, 1.0)) * 1.0
        + features.saturation * 0.3
    )
    scores.append(sandy_score)

    # Add small random noise for variety
    noise = rng.uniform(-0.2, 0.2, size=len(scores))
    scores = [s + n for s, n in zip(scores, noise)]

    best_idx = int(np.argmax(scores))
    soil = SOIL_TYPES[best_idx]

    # Confidence based on margin between top two scores
    sorted_scores = sorted(scores, reverse=True)
    margin = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else 1.0
    base_confidence = min(0.65 + margin * 0.12, 0.96)
    confidence = round(base_confidence + rng.uniform(-0.03, 0.03), 2)
    confidence = max(0.60, min(0.96, confidence))

    # Estimated pH and organic carbon within the soil type range
    ph = round(rng.uniform(*soil["ph_range"]), 1)
    organic_carbon = round(rng.uniform(*soil["organic_carbon_pct"]), 2)

    # Texture classification based on image texture variance
    if features.texture_variance > 50:
        texture = "clayey"
    elif features.texture_variance > 30:
        texture = "loamy"
    else:
        texture = "sandy"

    # Nutrient estimates (mock but realistic ranges for Indian soils)
    nitrogen_kg_ha = round(rng.uniform(120, 350), 0)
    phosphorus_kg_ha = round(rng.uniform(8, 45), 0)
    potassium_kg_ha = round(rng.uniform(100, 400), 0)

    # Recommendations based on soil type
    recommendations = []
    if ph > 7.5:
        recommendations.append("Apply gypsum (2-3 tonnes/ha) to reduce alkalinity")
    if ph < 5.5:
        recommendations.append("Apply agricultural lime (1-2 tonnes/ha) to correct acidity")
    if organic_carbon < 0.5:
        recommendations.append("Increase organic matter with FYM (10-15 tonnes/ha) or green manure")
    if nitrogen_kg_ha < 200:
        recommendations.append("Apply nitrogen fertilizer (urea 100-150 kg/ha) in split doses")
    if phosphorus_kg_ha < 15:
        recommendations.append("Apply phosphorus (DAP 50-100 kg/ha) at sowing time")
    if soil["drainage"] == "poor":
        recommendations.append("Create raised beds or ridges to improve drainage during monsoon")
    if soil["drainage"] == "excessive":
        recommendations.append("Apply mulch (5-7 cm) to conserve soil moisture")

    return {
        "soil_type": soil["type"],
        "soil_description": soil["description"],
        "confidence": confidence,
        "texture": texture,
        "estimated_ph": ph,
        "organic_carbon_pct": organic_carbon,
        "drainage": soil["drainage"],
        "nutrients": {
            "nitrogen_kg_ha": nitrogen_kg_ha,
            "phosphorus_kg_ha": phosphorus_kg_ha,
            "potassium_kg_ha": potassium_kg_ha,
        },
        "suitable_crops": soil["suitable_crops"],
        "common_regions": soil["india_regions"],
        "recommendations": recommendations,
        "image_analysis": {
            "brightness": round(features.brightness, 1),
            "redness_index": round(features.redness, 3),
            "greenness_index": round(features.greenness, 3),
            "texture_variance": round(features.texture_variance, 1),
            "saturation": round(features.saturation, 3),
        },
    }


# ---------------------------------------------------------------------------
# Crop disease detection logic (mock with heuristics)
# ---------------------------------------------------------------------------

CROP_DISEASES = [
    {
        "name": "Leaf Blight",
        "description": "Fungal infection causing brown lesions on leaves",
        "severity": "moderate",
        "treatment": "Apply Mancozeb 75% WP (2g/L) or Copper Oxychloride spray",
        "prevention": "Use disease-resistant varieties, ensure proper spacing for air circulation",
        "trigger": "brownish",  # brownish patches
    },
    {
        "name": "Powdery Mildew",
        "description": "White powdery fungal growth on leaf surfaces",
        "severity": "moderate",
        "treatment": "Spray Karathane (0.05%) or Sulfur dust (25 kg/ha)",
        "prevention": "Avoid excessive nitrogen, maintain proper plant spacing",
        "trigger": "whitish",  # whitish patches
    },
    {
        "name": "Rust",
        "description": "Orange-brown pustules on leaf undersides causing yield loss",
        "severity": "high",
        "treatment": "Apply Propiconazole 25 EC (1ml/L) immediately",
        "prevention": "Plant resistant varieties, remove crop residue after harvest",
        "trigger": "orange",  # orange/rust colored spots
    },
    {
        "name": "Bacterial Wilt",
        "description": "Bacterial infection causing sudden wilting and plant death",
        "severity": "high",
        "treatment": "Remove infected plants, apply Streptocycline (0.01%) soil drench",
        "prevention": "Crop rotation with non-host crops, avoid waterlogging",
        "trigger": "wilting",  # low saturation, brownish-yellow
    },
    {
        "name": "Aphid Infestation",
        "description": "Sap-sucking insects causing leaf curl and stunted growth",
        "severity": "low",
        "treatment": "Spray Imidacloprid 17.8 SL (0.3ml/L) or neem oil (5ml/L)",
        "prevention": "Release natural predators (ladybugs), use yellow sticky traps",
        "trigger": "curling",  # high texture variance on green
    },
]


def analyze_crop_health(features: ImageFeatures, seed: int) -> dict:
    """
    Analyze crop health and detect diseases from image features.

    Heuristic logic:
    - High greenness, moderate brightness -> healthy
    - Low greenness or brownish tint -> possible disease
    - White patches (high brightness + low saturation) -> powdery mildew
    - Orange/rust tint -> rust disease
    - Low saturation + brown -> bacterial wilt
    """
    rng = np.random.RandomState(seed)

    # Overall health score based on greenness
    green_dominance = features.greenness - max(features.redness, features.blueness)
    base_health = 0.5 + green_dominance * 0.5

    # Adjust for brightness (very dark or very bright = less healthy)
    brightness_factor = 1.0 - abs(features.brightness - 130) / 200.0
    base_health += brightness_factor * 0.2

    # Adjust for saturation (healthy plants are saturated green)
    base_health += features.saturation * 0.15

    health_score = max(0.1, min(1.0, base_health + rng.uniform(-0.1, 0.1)))
    health_score = round(health_score, 2)

    # Detect diseases based on image features
    detected_diseases = []

    # Leaf Blight: brownish, moderate-low greenness
    if features.redness > 0.38 and features.greenness < 0.4 and features.brightness < 160:
        confidence = round(0.72 + rng.uniform(0, 0.18), 2)
        detected_diseases.append({
            "disease": "Leaf Blight",
            "confidence": confidence,
            "severity": "moderate",
            "affected_area_pct": round(rng.uniform(10, 40), 0),
            "treatment": CROP_DISEASES[0]["treatment"],
            "prevention": CROP_DISEASES[0]["prevention"],
        })

    # Powdery Mildew: bright patches, low saturation
    if features.brightness > 170 and features.saturation < 0.3:
        confidence = round(0.68 + rng.uniform(0, 0.20), 2)
        detected_diseases.append({
            "disease": "Powdery Mildew",
            "confidence": confidence,
            "severity": "moderate",
            "affected_area_pct": round(rng.uniform(5, 25), 0),
            "treatment": CROP_DISEASES[1]["treatment"],
            "prevention": CROP_DISEASES[1]["prevention"],
        })

    # Rust: orange-red tint, moderate brightness
    if features.redness > 0.42 and features.greenness < 0.35 and 100 < features.brightness < 180:
        confidence = round(0.75 + rng.uniform(0, 0.17), 2)
        detected_diseases.append({
            "disease": "Rust",
            "confidence": confidence,
            "severity": "high",
            "affected_area_pct": round(rng.uniform(15, 50), 0),
            "treatment": CROP_DISEASES[2]["treatment"],
            "prevention": CROP_DISEASES[2]["prevention"],
        })

    # Bacterial Wilt: low saturation, yellowish-brown
    if features.saturation < 0.25 and features.brightness < 140 and features.greenness < 0.38:
        confidence = round(0.65 + rng.uniform(0, 0.20), 2)
        detected_diseases.append({
            "disease": "Bacterial Wilt",
            "confidence": confidence,
            "severity": "high",
            "affected_area_pct": round(rng.uniform(20, 60), 0),
            "treatment": CROP_DISEASES[3]["treatment"],
            "prevention": CROP_DISEASES[3]["prevention"],
        })

    # Aphid Infestation: high texture variance on green
    if features.texture_variance > 45 and features.greenness > 0.35:
        confidence = round(0.60 + rng.uniform(0, 0.22), 2)
        detected_diseases.append({
            "disease": "Aphid Infestation",
            "confidence": confidence,
            "severity": "low",
            "affected_area_pct": round(rng.uniform(5, 20), 0),
            "treatment": CROP_DISEASES[4]["treatment"],
            "prevention": CROP_DISEASES[4]["prevention"],
        })

    # Determine overall assessment
    if not detected_diseases:
        if health_score >= 0.7:
            assessment = "Crop appears healthy with no visible disease symptoms"
        else:
            assessment = "Crop shows some stress signs but no specific disease detected. Monitor closely."
    else:
        high_severity = [d for d in detected_diseases if d["severity"] == "high"]
        if high_severity:
            assessment = f"URGENT: {len(high_severity)} high-severity issue(s) detected. Immediate treatment recommended."
        else:
            assessment = f"{len(detected_diseases)} issue(s) detected. Treatment recommended within 1-2 weeks."

    # Growth stage estimation based on greenness and texture
    if features.greenness > 0.42 and features.texture_variance > 35:
        growth_stage = "Vegetative (active growth)"
    elif features.greenness > 0.38:
        growth_stage = "Flowering/Reproductive"
    elif features.brightness > 160 and features.saturation < 0.25:
        growth_stage = "Maturity (ready for harvest)"
    else:
        growth_stage = "Early/Seedling"

    return {
        "health_score": health_score,
        "assessment": assessment,
        "growth_stage": growth_stage,
        "detected_diseases": detected_diseases,
        "disease_count": len(detected_diseases),
        "recommendations": _crop_recommendations(health_score, detected_diseases, features),
        "image_analysis": {
            "brightness": round(features.brightness, 1),
            "greenness_index": round(features.greenness, 3),
            "redness_index": round(features.redness, 3),
            "texture_variance": round(features.texture_variance, 1),
            "saturation": round(features.saturation, 3),
        },
    }


def _crop_recommendations(
    health_score: float, diseases: list, features: ImageFeatures
) -> list[str]:
    """Generate actionable recommendations based on crop analysis."""
    recs = []

    if health_score < 0.5:
        recs.append("Immediate soil testing recommended to check nutrient deficiencies")

    if diseases:
        recs.append("Isolate affected plants to prevent spread to healthy ones")
        if any(d["severity"] == "high" for d in diseases):
            recs.append("Contact local Krishi Vigyan Kendra (KVK) for expert diagnosis")
            recs.append("Consider crop insurance claim if yield loss exceeds 33%")

    if features.greenness < 0.35:
        recs.append("Apply foliar nitrogen spray (2% urea) for quick green-up")

    if features.brightness > 180:
        recs.append("Increase irrigation frequency - plants may be water-stressed")

    if not recs:
        recs.append("Continue current management practices")
        recs.append("Monitor weekly for any emerging pest or disease symptoms")
        recs.append("Apply preventive fungicide spray during wet weather periods")

    return recs


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "healthy",
        "service": "ml-inference",
        "version": "1.0.0",
        "capabilities": ["soil-classification", "crop-disease-detection"],
        "note": "Mock ML service for hackathon demo - uses image heuristics",
    }


@app.post("/analyze-soil")
async def analyze_soil(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
):
    """
    Analyze a soil image and return classification results.

    Accepts a single image file (JPEG/PNG) and optional location coordinates.
    Returns soil type, texture, pH estimate, nutrient analysis, and
    crop suitability recommendations.
    """
    start_time = time.time()

    # Validate file type
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Expected image file, got {image.content_type}",
        )

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        if len(contents) > 20 * 1024 * 1024:  # 20 MB limit
            raise HTTPException(status_code=400, detail="Image file too large (max 20MB)")

        img = Image.open(io.BytesIO(contents))
        features = ImageFeatures(img)
        seed = _deterministic_seed(contents)
        result = classify_soil(features, seed)

        elapsed_ms = round((time.time() - start_time) * 1000, 0)

        return {
            "status": "success",
            "analysis_type": "soil_classification",
            "processing_time_ms": elapsed_ms,
            "image_dimensions": {"width": features.width, "height": features.height},
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            }
            if latitude is not None
            else None,
            "result": result,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze soil image: {str(e)}",
        )


@app.post("/analyze-crop")
async def analyze_crop(
    image: UploadFile = File(...),
    crop_name: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
):
    """
    Analyze a crop image for disease detection and health assessment.

    Accepts a single image file (JPEG/PNG), optional crop name, and location.
    Returns health score, detected diseases, severity levels, and treatment
    recommendations.
    """
    start_time = time.time()

    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Expected image file, got {image.content_type}",
        )

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        if len(contents) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file too large (max 20MB)")

        img = Image.open(io.BytesIO(contents))
        features = ImageFeatures(img)
        seed = _deterministic_seed(contents)
        result = analyze_crop_health(features, seed)

        elapsed_ms = round((time.time() - start_time) * 1000, 0)

        return {
            "status": "success",
            "analysis_type": "crop_health",
            "processing_time_ms": elapsed_ms,
            "image_dimensions": {"width": features.width, "height": features.height},
            "crop_name": crop_name,
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            }
            if latitude is not None
            else None,
            "result": result,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze crop image: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8100, log_level="info")
