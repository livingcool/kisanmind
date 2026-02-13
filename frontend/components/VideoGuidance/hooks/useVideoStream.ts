// components/VideoGuidance/hooks/useVideoStream.ts - Hook for managing camera video stream

import { useState, useEffect, useRef } from 'react';

export interface VideoStreamOptions {
  preferredCamera?: 'user' | 'environment'; // 'environment' is rear camera
  width?: number;
  height?: number;
}

export interface VideoStreamState {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
}

/**
 * Custom hook to manage video stream from user's camera
 * Handles permission requests, stream initialization, and cleanup
 */
export function useVideoStream(options: VideoStreamOptions = {}) {
  const {
    preferredCamera = 'environment', // Default to rear camera for mobile
    width = 1280,
    height = 720,
  } = options;

  const [state, setState] = useState<VideoStreamState>({
    stream: null,
    isLoading: false,
    error: null,
    hasPermission: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start the video stream
   */
  const startStream = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: preferredCamera,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      setState({
        stream,
        isLoading: false,
        error: null,
        hasPermission: true,
      });

      // Attach stream to video element if ref is available
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays (some browsers require explicit play call)
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video autoplay failed:', playError);
        }
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);

      let errorMessage = 'Failed to access camera';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application';
      }

      setState({
        stream: null,
        isLoading: false,
        error: errorMessage,
        hasPermission: false,
      });
    }
  };

  /**
   * Stop the video stream
   */
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState({
      stream: null,
      isLoading: false,
      error: null,
      hasPermission: false,
    });
  };

  /**
   * Switch camera (front/back)
   */
  const switchCamera = async () => {
    const newFacingMode = preferredCamera === 'user' ? 'environment' : 'user';
    stopStream();

    // Restart with new camera
    await startStream();
  };

  /**
   * Capture current frame from video
   */
  const captureFrame = (): string | null => {
    if (!videoRef.current || !streamRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Return as base64 data URL (JPEG format, 0.9 quality for good balance)
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // Sync stream to video element when either changes
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      // Ensure video plays
      videoRef.current.play().catch((error) => {
        console.warn('Video autoplay failed:', error);
      });
    }
  }, [state.stream]); // Re-run when stream changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return {
    ...state,
    videoRef,
    startStream,
    stopStream,
    switchCamera,
    captureFrame,
  };
}

/**
 * Usage example:
 *
 * const { stream, isLoading, error, videoRef, startStream, captureFrame } = useVideoStream({
 *   preferredCamera: 'environment',
 * });
 *
 * useEffect(() => {
 *   startStream();
 * }, []);
 *
 * <video ref={videoRef} autoPlay playsInline />
 * <button onClick={() => {
 *   const imageData = captureFrame();
 *   if (imageData) console.log('Captured:', imageData);
 * }}>Capture</button>
 */
