// components/VideoGuidance/hooks/useImageQuality.ts - Hook for image quality assessment

import { useState, useCallback } from 'react';

export interface QualityResult {
  score: number; // 0-100
  feedback: string;
  isAcceptable: boolean;
  metrics: {
    brightness: number;
    sharpness: number;
    size: number;
  };
}

const BRIGHTNESS_MIN = 50;
const BRIGHTNESS_MAX = 220;
const MIN_SIZE_BYTES = 10000; // 10KB minimum

/**
 * Hook for analyzing image quality
 * Uses canvas-based analysis (no external dependencies)
 */
export function useImageQuality() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Analyze image quality from data URL
   */
  const analyzeQuality = useCallback(
    async (dataUrl: string): Promise<QualityResult> => {
      setIsAnalyzing(true);

      try {
        // Load image
        const img = await loadImage(dataUrl);

        // Create canvas for analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Use smaller size for analysis (performance)
        const analysisWidth = Math.min(img.width, 640);
        const analysisHeight = Math.min(img.height, 480);

        canvas.width = analysisWidth;
        canvas.height = analysisHeight;

        ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight);

        // Get image data
        const imageData = ctx.getImageData(0, 0, analysisWidth, analysisHeight);

        // Calculate metrics
        const brightness = calculateBrightness(imageData);
        const sharpness = estimateSharpness(imageData);
        const size = estimateSize(dataUrl);

        // Calculate overall score (weighted average)
        let score = 0;
        let feedback = '';

        // Brightness score (40% weight)
        let brightnessScore = 0;
        if (brightness < BRIGHTNESS_MIN) {
          brightnessScore = (brightness / BRIGHTNESS_MIN) * 40;
          feedback = 'Image is too dark. Try better lighting.';
        } else if (brightness > BRIGHTNESS_MAX) {
          brightnessScore = ((255 - brightness) / (255 - BRIGHTNESS_MAX)) * 40;
          feedback = 'Image is too bright. Avoid direct sunlight.';
        } else {
          brightnessScore = 40;
        }

        // Sharpness score (40% weight)
        const sharpnessScore = Math.min((sharpness / 10) * 40, 40);

        // Size score (20% weight)
        const sizeScore = size > MIN_SIZE_BYTES ? 20 : (size / MIN_SIZE_BYTES) * 20;

        score = Math.round(brightnessScore + sharpnessScore + sizeScore);

        // Determine feedback
        if (score >= 80) {
          feedback = 'Excellent quality! Ready to capture.';
        } else if (score >= 60) {
          feedback = 'Good quality. You can capture now.';
        } else if (score >= 40) {
          if (brightness < BRIGHTNESS_MIN) {
            feedback = 'Image too dark. Add more light.';
          } else if (brightness > BRIGHTNESS_MAX) {
            feedback = 'Image too bright. Move to shade.';
          } else {
            feedback = 'Hold camera steady and focus.';
          }
        } else {
          feedback = 'Poor quality. Check lighting and focus.';
        }

        const isAcceptable = score >= 50;

        setIsAnalyzing(false);

        return {
          score,
          feedback,
          isAcceptable,
          metrics: {
            brightness: Math.round(brightness),
            sharpness: Math.round(sharpness * 10) / 10,
            size,
          },
        };
      } catch (error) {
        console.error('Error analyzing image quality:', error);
        setIsAnalyzing(false);

        // Return default acceptable result on error
        return {
          score: 70,
          feedback: 'Quality check unavailable. Proceed with capture.',
          isAcceptable: true,
          metrics: {
            brightness: 128,
            sharpness: 5,
            size: 50000,
          },
        };
      }
    },
    []
  );

  return {
    analyzeQuality,
    isAnalyzing,
  };
}

/**
 * Calculate average brightness from image data
 */
function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let sum = 0;

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate perceived brightness
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  return sum / (data.length / 16);
}

/**
 * Estimate sharpness using gradient magnitude
 */
function estimateSharpness(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let sum = 0;
  let count = 0;

  // Sample gradient at various points
  for (let y = 1; y < height - 1; y += 5) {
    for (let x = 1; x < width - 1; x += 5) {
      const idx = (y * width + x) * 4;

      // Horizontal gradient
      const gx = Math.abs(data[idx] - data[idx + 4]);

      // Vertical gradient
      const gy = Math.abs(data[idx] - data[idx + width * 4]);

      // Gradient magnitude
      sum += Math.sqrt(gx * gx + gy * gy);
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

/**
 * Estimate file size from data URL
 */
function estimateSize(dataUrl: string): number {
  // Base64 encoded size is roughly 4/3 of actual size
  const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;
  return Math.round((base64Length * 3) / 4);
}

/**
 * Load image from data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Usage example:
 *
 * const { analyzeQuality, isAnalyzing } = useImageQuality();
 *
 * const handleCapture = async (imageData: string) => {
 *   const quality = await analyzeQuality(imageData);
 *   console.log('Quality score:', quality.score);
 *   console.log('Feedback:', quality.feedback);
 * };
 */
