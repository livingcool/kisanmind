/**
 * Video Quality Analyzer
 *
 * Server-side image quality analysis for the video guidance capture flow.
 * Analyzes base64-encoded frames for:
 * - Blur (Laplacian variance)
 * - Brightness (too dark / too bright)
 * - Distance estimation (simple heuristics based on edge density)
 *
 * Uses the Sharp library for efficient image processing without OpenCV.
 * All analysis targets < 50ms per frame for real-time performance.
 */

import sharp from 'sharp';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QualityIssue = 'good' | 'blur' | 'dark' | 'bright' | 'far' | 'close';

export interface QualityAnalysis {
  /** Overall quality score 0-100 */
  score: number;
  /** Whether the frame is acceptable for capture */
  isAcceptable: boolean;
  /** Primary quality issue detected */
  primaryIssue: QualityIssue;
  /** Specific quality feedback key (maps to TTS instruction IDs) */
  feedbackId: string;
  /** Detailed metrics */
  metrics: {
    /** Average brightness (0-255) */
    brightness: number;
    /** Blur score - higher is sharper (Laplacian variance) */
    sharpness: number;
    /** Edge density - higher means more detail/closer to subject (0-1) */
    edgeDensity: number;
    /** Contrast (standard deviation of luminance) */
    contrast: number;
  };
  /** Processing time in milliseconds */
  processingTime: number;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Minimum acceptable brightness (0-255) */
const BRIGHTNESS_MIN = 50;

/** Maximum acceptable brightness (0-255) */
const BRIGHTNESS_MAX = 200;

/** Minimum sharpness (Laplacian variance) - below this is blurry */
const SHARPNESS_MIN = 100;

/** Minimum edge density for acceptable distance */
const EDGE_DENSITY_MIN = 0.03;

/** Maximum edge density (too close, no context) */
const EDGE_DENSITY_MAX = 0.40;

/** Minimum contrast (standard deviation) for useful image */
const CONTRAST_MIN = 20;

/** Analysis resolution - downscale to this for speed */
const ANALYSIS_WIDTH = 320;
const ANALYSIS_HEIGHT = 240;

// ---------------------------------------------------------------------------
// Quality Analyzer
// ---------------------------------------------------------------------------

export class QualityAnalyzer {
  /**
   * Analyze a single frame for quality.
   *
   * @param imageData - Base64-encoded image data (with or without data URL prefix)
   * @returns Quality analysis result
   */
  async analyzeFrame(imageData: string): Promise<QualityAnalysis> {
    const startTime = Date.now();

    try {
      // Strip data URL prefix if present
      const base64Data = imageData.includes(',')
        ? imageData.split(',')[1]
        : imageData;

      const buffer = Buffer.from(base64Data, 'base64');

      // Resize for analysis (much faster than processing full resolution)
      const resized = await sharp(buffer)
        .resize(ANALYSIS_WIDTH, ANALYSIS_HEIGHT, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data: grayPixels, info } = resized;
      const width = info.width;
      const height = info.height;
      const pixelCount = width * height;

      // Calculate brightness (mean luminance)
      let brightnessSum = 0;
      for (let i = 0; i < pixelCount; i++) {
        brightnessSum += grayPixels[i];
      }
      const brightness = brightnessSum / pixelCount;

      // Calculate contrast (standard deviation of luminance)
      let varianceSum = 0;
      for (let i = 0; i < pixelCount; i++) {
        const diff = grayPixels[i] - brightness;
        varianceSum += diff * diff;
      }
      const contrast = Math.sqrt(varianceSum / pixelCount);

      // Calculate sharpness using Laplacian variance
      // Laplacian kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
      let laplacianSum = 0;
      let laplacianCount = 0;
      const laplacianValues: number[] = [];

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const laplacian =
            grayPixels[idx - width] +          // top
            grayPixels[idx - 1] +              // left
            -4 * grayPixels[idx] +             // center
            grayPixels[idx + 1] +              // right
            grayPixels[idx + width];            // bottom

          laplacianValues.push(laplacian);
          laplacianSum += laplacian;
          laplacianCount++;
        }
      }

      const laplacianMean = laplacianSum / laplacianCount;
      let laplacianVariance = 0;
      for (const val of laplacianValues) {
        const diff = val - laplacianMean;
        laplacianVariance += diff * diff;
      }
      laplacianVariance /= laplacianCount;
      const sharpness = laplacianVariance;

      // Calculate edge density using simple Sobel approximation
      let edgePixels = 0;
      const edgeThreshold = 30; // Pixel gradient threshold

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;

          // Horizontal gradient
          const gx = Math.abs(grayPixels[idx + 1] - grayPixels[idx - 1]);

          // Vertical gradient
          const gy = Math.abs(grayPixels[idx + width] - grayPixels[idx - width]);

          // Gradient magnitude
          const magnitude = Math.sqrt(gx * gx + gy * gy);

          if (magnitude > edgeThreshold) {
            edgePixels++;
          }
        }
      }

      const edgeDensity = edgePixels / ((width - 2) * (height - 2));

      // Determine primary issue
      const metrics = {
        brightness: Math.round(brightness),
        sharpness: Math.round(sharpness),
        edgeDensity: Math.round(edgeDensity * 1000) / 1000,
        contrast: Math.round(contrast * 10) / 10,
      };

      const { score, primaryIssue, feedbackId, isAcceptable } =
        this.evaluateMetrics(metrics);

      const processingTime = Date.now() - startTime;

      return {
        score,
        isAcceptable,
        primaryIssue,
        feedbackId,
        metrics,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('[QualityAnalyzer] Frame analysis failed:', error);

      // Return a permissive fallback so the user can still capture
      return {
        score: 70,
        isAcceptable: true,
        primaryIssue: 'good',
        feedbackId: 'quality_acceptable',
        metrics: {
          brightness: 128,
          sharpness: 200,
          edgeDensity: 0.1,
          contrast: 50,
        },
        processingTime,
      };
    }
  }

  /**
   * Evaluate metrics against thresholds and compute the overall score.
   */
  private evaluateMetrics(metrics: QualityAnalysis['metrics']): {
    score: number;
    primaryIssue: QualityIssue;
    feedbackId: string;
    isAcceptable: boolean;
  } {
    const issues: Array<{ issue: QualityIssue; severity: number; feedbackId: string }> = [];

    // Check brightness
    if (metrics.brightness < BRIGHTNESS_MIN) {
      const severity = 1 - metrics.brightness / BRIGHTNESS_MIN;
      issues.push({ issue: 'dark', severity, feedbackId: 'too_dark' });
    } else if (metrics.brightness > BRIGHTNESS_MAX) {
      const severity = (metrics.brightness - BRIGHTNESS_MAX) / (255 - BRIGHTNESS_MAX);
      issues.push({ issue: 'bright', severity, feedbackId: 'too_bright' });
    }

    // Check sharpness
    if (metrics.sharpness < SHARPNESS_MIN) {
      const severity = 1 - metrics.sharpness / SHARPNESS_MIN;
      issues.push({ issue: 'blur', severity, feedbackId: 'too_blurry' });
    }

    // Check distance (edge density)
    if (metrics.edgeDensity < EDGE_DENSITY_MIN) {
      const severity = 1 - metrics.edgeDensity / EDGE_DENSITY_MIN;
      issues.push({ issue: 'far', severity, feedbackId: 'too_far' });
    } else if (metrics.edgeDensity > EDGE_DENSITY_MAX) {
      const severity = (metrics.edgeDensity - EDGE_DENSITY_MAX) / (1 - EDGE_DENSITY_MAX);
      issues.push({ issue: 'close', severity, feedbackId: 'too_close' });
    }

    // Calculate component scores (0-25 each, total 0-100)
    const brightnessScore = this.computeBrightnessScore(metrics.brightness);
    const sharpnessScore = this.computeSharpnessScore(metrics.sharpness);
    const edgeScore = this.computeEdgeScore(metrics.edgeDensity);
    const contrastScore = this.computeContrastScore(metrics.contrast);

    const score = Math.round(brightnessScore + sharpnessScore + edgeScore + contrastScore);

    // Determine primary issue (highest severity)
    if (issues.length === 0) {
      if (score >= 80) {
        return { score, primaryIssue: 'good', feedbackId: 'quality_good', isAcceptable: true };
      }
      return { score, primaryIssue: 'good', feedbackId: 'quality_acceptable', isAcceptable: true };
    }

    // Sort by severity descending
    issues.sort((a, b) => b.severity - a.severity);
    const primary = issues[0];
    const isAcceptable = score >= 50;

    return {
      score,
      primaryIssue: primary.issue,
      feedbackId: isAcceptable ? 'quality_acceptable' : primary.feedbackId,
      isAcceptable,
    };
  }

  private computeBrightnessScore(brightness: number): number {
    if (brightness < BRIGHTNESS_MIN) {
      return (brightness / BRIGHTNESS_MIN) * 25;
    }
    if (brightness > BRIGHTNESS_MAX) {
      return Math.max(0, (1 - (brightness - BRIGHTNESS_MAX) / (255 - BRIGHTNESS_MAX)) * 25);
    }
    return 25;
  }

  private computeSharpnessScore(sharpness: number): number {
    if (sharpness < SHARPNESS_MIN) {
      return (sharpness / SHARPNESS_MIN) * 30;
    }
    // Above minimum, full score
    return 30;
  }

  private computeEdgeScore(edgeDensity: number): number {
    if (edgeDensity < EDGE_DENSITY_MIN) {
      return (edgeDensity / EDGE_DENSITY_MIN) * 20;
    }
    if (edgeDensity > EDGE_DENSITY_MAX) {
      return Math.max(0, (1 - (edgeDensity - EDGE_DENSITY_MAX) / (1 - EDGE_DENSITY_MAX)) * 20);
    }
    return 20;
  }

  private computeContrastScore(contrast: number): number {
    if (contrast < CONTRAST_MIN) {
      return (contrast / CONTRAST_MIN) * 25;
    }
    return 25;
  }
}

// Singleton
let analyzerInstance: QualityAnalyzer | null = null;

export function getQualityAnalyzer(): QualityAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new QualityAnalyzer();
  }
  return analyzerInstance;
}
