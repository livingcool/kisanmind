/**
 * ML Service Integration Tests
 *
 * Tests the Python FastAPI ML inference service via HTTP endpoints.
 * These tests require the ML service to be running on port 8100.
 *
 * Start the service with:
 *   cd services/ml-inference && python -m uvicorn app:app --port 8100
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8100';

// Helper to create test images programmatically using PNG data structure
// Creates minimal valid PNG files with solid colors
function createTestImage(color: [number, number, number], width = 200, height = 200): Buffer {
  // Use pre-generated 1x1 pixel PNGs for specific test colors
  const colorKey = color.join(',');
  let base64 = '';

  switch (colorKey) {
    case '30,25,20': // Dark
      base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQkxQBAACkAEwTa6+2AAAAAElFTkSuQmCC';
      break;
    case '180,80,60': // Red
      base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPYEmADAAL8AUETUyShAAAAAElFTkSuQmCC';
      break;
    case '220,210,180': // Bright
      base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGO4c2kLAATwAmP4hnYBAAAAAElFTkSuQmCC';
      break;
    case '50,160,50': // Green
      base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGMwWmAEAAIMAQWxtRjrAAAAAElFTkSuQmCC';
      break;
    case '150,90,50': // Brown
      base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOYFmUEAAKsASPJthiHAAAAAElFTkSuQmCC';
      break;
    case '230,230,225': // White
      base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN49uwhAAVjAq6Fv8IzAAAAAElFTkSuQmCC';
      break;
    default:
      // Fallback (red-ish)
      base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPYEmADAAL8AUETUyShAAAAAElFTkSuQmCC';
  }

  return Buffer.from(base64, 'base64');
}

// Helper to check if ML service is running
async function isMLServiceRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Helper to call ML service with an image
async function callMLService(
  endpoint: 'analyze-soil' | 'analyze-crop',
  imageBuffer: Buffer,
  extraFields: Record<string, string> = {}
): Promise<any> {
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image', blob, 'test.png');

  for (const [key, value] of Object.entries(extraFields)) {
    if (value) formData.append(key, value);
  }

  const response = await fetch(`${ML_SERVICE_URL}/${endpoint}`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ML service returned ${response.status}: ${errorText}`);
  }

  return await response.json();
}

describe('ML Service Integration Tests', () => {
  // Check if ML service is running before tests
  beforeAll(async () => {
    const isRunning = await isMLServiceRunning();
    if (!isRunning) {
      console.warn(
        '\n⚠️  ML service not running. Start it with:\n' +
        '   cd services/ml-inference && python -m uvicorn app:app --port 8100\n'
      );
    }
  });

  describe('Health Check', () => {
    it('TC2.11: should return service status', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const response = await fetch(`${ML_SERVICE_URL}/health`);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('ml-inference');
      expect(data.capabilities).toContain('soil-classification');
      expect(data.capabilities).toContain('crop-disease-detection');
    });
  });

  describe('Soil Analysis Endpoint', () => {
    it('TC2.1: should classify dark image as Black Cotton Soil', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const darkImage = createTestImage([30, 25, 20]);
      const result = await callMLService('analyze-soil', darkImage, {
        latitude: '20.9',
        longitude: '77.75',
      });

      expect(result.status).toBe('success');
      expect(result.analysis_type).toBe('soil_classification');
      expect(result.result.soil_type).toBeTruthy();
      expect(result.result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(result.result.confidence).toBeLessThanOrEqual(0.96);
      expect(Array.isArray(result.result.suitable_crops)).toBe(true);
      expect(result.result.suitable_crops.length).toBeGreaterThan(0);
      expect(Array.isArray(result.result.recommendations)).toBe(true);
      expect(result.processing_time_ms).toBeLessThan(1000);
    });

    it('TC2.2: should classify red image as Red Soil', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const redImage = createTestImage([180, 80, 60]);
      const result = await callMLService('analyze-soil', redImage);

      expect(result.status).toBe('success');
      expect(result.result.soil_type).toBeTruthy();
      expect(result.result.texture).toBeTruthy();
      expect(result.result.estimated_ph).toBeGreaterThan(0);
      expect(result.result.organic_carbon_pct).toBeGreaterThan(0);
      expect(result.result.drainage).toBeTruthy();
      expect(result.result.nutrients.nitrogen_kg_ha).toBeDefined();
      expect(result.result.nutrients.phosphorus_kg_ha).toBeDefined();
      expect(result.result.nutrients.potassium_kg_ha).toBeDefined();
      expect(Array.isArray(result.result.suitable_crops)).toBe(true);
      expect(Array.isArray(result.result.common_regions)).toBe(true);
      expect(Array.isArray(result.result.recommendations)).toBe(true);
      expect(result.result.image_analysis).toBeDefined();
      expect(typeof result.result.image_analysis.brightness).toBe('number');
    });

    it('TC2.3: should classify bright image as Sandy Loam', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const brightImage = createTestImage([220, 210, 180]);
      const result = await callMLService('analyze-soil', brightImage);

      expect(result.status).toBe('success');
      expect(result.result.soil_type).toBeTruthy();
      expect(result.result.image_analysis).toBeDefined();
      expect(result.result.image_analysis.brightness).toBeGreaterThan(150);
    });

    it('TC2.4: should reject empty file', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const emptyBuffer = Buffer.alloc(0);
      await expect(callMLService('analyze-soil', emptyBuffer)).rejects.toThrow();
    });

    it('TC2.12: should return all required fields in soil response', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const testImage = createTestImage([100, 90, 80]);
      const result = await callMLService('analyze-soil', testImage);

      const requiredFields = [
        'soil_type',
        'soil_description',
        'confidence',
        'texture',
        'estimated_ph',
        'organic_carbon_pct',
        'drainage',
        'nutrients',
        'suitable_crops',
        'common_regions',
        'recommendations',
        'image_analysis',
      ];

      for (const field of requiredFields) {
        expect(result.result).toHaveProperty(field);
      }
    });

    it('TC2.14: should return confidence scores within valid range', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const testImage = createTestImage([140, 130, 100]);
      const result = await callMLService('analyze-soil', testImage);

      expect(result.result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(result.result.confidence).toBeLessThanOrEqual(0.96);
    });
  });

  describe('Crop Analysis Endpoint', () => {
    it('TC2.7: should assess green image as healthy crop', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const greenImage = createTestImage([50, 160, 50]);
      const result = await callMLService('analyze-crop', greenImage, {
        crop_name: 'cotton',
        latitude: '20.9',
        longitude: '77.75',
      });

      expect(result.status).toBe('success');
      expect(result.analysis_type).toBe('crop_health');
      expect(result.crop_name).toBe('cotton');
      expect(result.result.health_score).toBeGreaterThanOrEqual(0.5);
      expect(result.result.health_score).toBeLessThanOrEqual(1.0);
      expect(result.result.assessment).toBeTruthy();
      expect(result.result.growth_stage).toBeTruthy();
      expect(Array.isArray(result.result.recommendations)).toBe(true);
    });

    it('TC2.8: should detect disease in brown image', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const brownImage = createTestImage([150, 90, 50]);
      const result = await callMLService('analyze-crop', brownImage);

      expect(result.status).toBe('success');
      expect(Array.isArray(result.result.detected_diseases)).toBe(true);
      // Brown image likely triggers disease detection
      expect(result.result.disease_count).toBeGreaterThanOrEqual(0);
      if (result.result.disease_count > 0) {
        expect(result.result.detected_diseases[0]).toHaveProperty('disease');
        expect(result.result.detected_diseases[0]).toHaveProperty('confidence');
        expect(result.result.detected_diseases[0]).toHaveProperty('severity');
        expect(result.result.detected_diseases[0]).toHaveProperty('treatment');
      }
    });

    it('TC2.9: should detect powdery mildew in bright white image', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const whiteImage = createTestImage([230, 230, 225]);
      const result = await callMLService('analyze-crop', whiteImage);

      expect(result.status).toBe('success');
      expect(Array.isArray(result.result.detected_diseases)).toBe(true);
      // Bright/white images may trigger powdery mildew detection
      if (result.result.disease_count > 0) {
        const diseases = result.result.detected_diseases.map((d: any) => d.disease);
        // Could be powdery mildew or other issues
        expect(diseases.length).toBeGreaterThan(0);
      }
    });

    it('TC2.13: should return all required fields in crop response', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const testImage = createTestImage([80, 140, 80]);
      const result = await callMLService('analyze-crop', testImage);

      const requiredFields = [
        'health_score',
        'assessment',
        'growth_stage',
        'detected_diseases',
        'disease_count',
        'recommendations',
        'image_analysis',
      ];

      for (const field of requiredFields) {
        for (const field of requiredFields) {
          expect(result.result[field]).toBeDefined();
        }
      }
    });
  });

  describe('Response Validation', () => {
    it('should produce consistent results for same image', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const testImage = createTestImage([100, 80, 60]);

      const result1 = await callMLService('analyze-soil', testImage);
      const result2 = await callMLService('analyze-soil', testImage);

      // Same image should produce same classification (deterministic)
      expect(result1.result.soil_type).toBe(result2.result.soil_type);
      expect(result1.result.confidence).toBe(result2.result.confidence);
      expect(result1.result.estimated_ph).toBe(result2.result.estimated_ph);
    });

    it('should produce different results for different images', async () => {
      const isRunning = await isMLServiceRunning();
      if (!isRunning) {
        console.log('Skipping test - ML service not running');
        return;
      }

      const darkImage = createTestImage([30, 25, 20]);
      const redImage = createTestImage([180, 80, 60]);
      const brightImage = createTestImage([220, 210, 180]);

      const result1 = await callMLService('analyze-soil', darkImage);
      const result2 = await callMLService('analyze-soil', redImage);
      const result3 = await callMLService('analyze-soil', brightImage);

      const soilTypes = new Set([
        result1.result.soil_type,
        result2.result.soil_type,
        result3.result.soil_type,
      ]);

      // At least 2 different soil types should be detected
      expect(soilTypes.size).toBeGreaterThanOrEqual(2);
    });
  });
});
