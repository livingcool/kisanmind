// components/VideoGuidance/hooks/useImageUpload.ts - Hook for uploading images to visual assessment API

import { useState } from 'react';

export interface CapturedImage {
  id: string;
  type: 'soil' | 'crop' | 'field';
  dataUrl: string;
  timestamp: number;
}

export interface UploadResult {
  success: boolean;
  assessmentId?: string;
  error?: string;
  assessment?: VisualAssessmentResult;
}

export interface VisualAssessmentResult {
  id: string;
  sessionId: string;
  soilAnalysis?: {
    soilType: string;
    color: string;
    texture: string;
    moisture: string;
    healthScore: number;
    recommendations: string[];
  };
  cropAnalysis?: {
    cropType: string;
    healthStatus: string;
    diseases: string[];
    pests: string[];
    recommendations: string[];
  };
  confidence: number;
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Hook for uploading captured images to the visual assessment API
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert data URL to Blob
   */
  const dataURLtoBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  };

  /**
   * Compress image for faster upload
   */
  const compressImage = async (
    dataUrl: string,
    maxSizeKB: number = 200
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions (max 1200px on longest side)
        const maxDimension = 1200;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with quality 0.9 and reduce if needed
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Reduce quality until size is acceptable
        while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.5) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  };

  /**
   * Upload images to the visual assessment API
   */
  const uploadImages = async (
    images: CapturedImage[],
    sessionId: string,
    location: { lat: number; lon: number }
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();

      // Separate images by type
      const soilImages = images.filter((img) => img.type === 'soil');
      const cropImages = images.filter((img) => img.type === 'crop');
      const fieldImages = images.filter((img) => img.type === 'field');

      // Compress and add soil images
      setProgress(20);
      for (const img of soilImages) {
        const compressed = await compressImage(img.dataUrl);
        const blob = dataURLtoBlob(compressed);
        formData.append('soilImages', blob, `soil_${img.id}.jpg`);
      }

      // Compress and add crop images
      setProgress(40);
      for (const img of cropImages) {
        const compressed = await compressImage(img.dataUrl);
        const blob = dataURLtoBlob(compressed);
        formData.append('cropImages', blob, `crop_${img.id}.jpg`);
      }

      // Compress and add field images
      setProgress(60);
      for (const img of fieldImages) {
        const compressed = await compressImage(img.dataUrl);
        const blob = dataURLtoBlob(compressed);
        formData.append('fieldImages', blob, `field_${img.id}.jpg`);
      }

      // Add metadata
      formData.append('sessionId', sessionId);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lon.toString());
      formData.append('capturedAt', new Date().toISOString());

      // Upload to API
      setProgress(80);
      const response = await fetch(`${API_URL}/api/visual-assessment`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();

      setProgress(100);
      setUploading(false);

      return {
        success: true,
        assessmentId: result.id,
        assessment: result.assessment,
      };
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'Failed to upload images';

      setError(errorMessage);
      setUploading(false);
      setProgress(0);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Get existing assessment by ID
   */
  const getAssessment = async (
    assessmentId: string
  ): Promise<VisualAssessmentResult | null> => {
    try {
      const response = await fetch(
        `${API_URL}/api/visual-assessment/${assessmentId}`
      );

      if (!response.ok) {
        throw new Error('Failed to get assessment');
      }

      return await response.json();
    } catch (err) {
      console.error('Error getting assessment:', err);
      return null;
    }
  };

  /**
   * Get latest assessment for a session
   */
  const getLatestAssessment = async (
    sessionId: string
  ): Promise<VisualAssessmentResult | null> => {
    try {
      const response = await fetch(
        `${API_URL}/api/visual-assessment/session/${sessionId}/latest`
      );

      if (!response.ok) {
        throw new Error('Failed to get latest assessment');
      }

      return await response.json();
    } catch (err) {
      console.error('Error getting latest assessment:', err);
      return null;
    }
  };

  return {
    uploadImages,
    getAssessment,
    getLatestAssessment,
    uploading,
    progress,
    error,
  };
}

/**
 * Usage example:
 *
 * const { uploadImages, uploading, progress } = useImageUpload();
 *
 * const handleUpload = async () => {
 *   const result = await uploadImages(
 *     capturedImages,
 *     'session-123',
 *     { lat: 20.5, lon: 77.0 }
 *   );
 *
 *   if (result.success) {
 *     console.log('Assessment ID:', result.assessmentId);
 *   }
 * };
 */
